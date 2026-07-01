import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { CreateCategoryDto } from './dto/create-category.dto'
import { CreateConfigurableOptionDto, UpdateConfigurableOptionDto } from './dto/configurable-option.dto'
import { parseSignedMoney } from '../../common/utils/money'

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ─── Categories ────────────────────────────────────────────────────────────

  async findAllCategories(organizationId: string) {
    return this.prisma.productCategory.findMany({
      where: { organizationId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    })
  }

  async createCategory(organizationId: string, userId: string, dto: CreateCategoryDto) {
    const exists = await this.prisma.productCategory.findUnique({
      where: { organizationId_slug: { organizationId, slug: dto.slug } },
    })
    if (exists) throw new ConflictException('Já existe uma categoria com este slug')

    const category = await this.prisma.productCategory.create({
      data: { ...dto, organizationId },
    })

    await this.audit.log({ organizationId, userId, action: 'category.created', entity: 'product_category', entityId: category.id, after: category })
    return category
  }

  async updateCategory(organizationId: string, userId: string, id: string, dto: Partial<CreateCategoryDto>) {
    const category = await this.prisma.productCategory.findFirst({ where: { id, organizationId } })
    if (!category) throw new NotFoundException('Categoria não encontrada')

    const updated = await this.prisma.productCategory.update({ where: { id }, data: dto })
    await this.audit.log({ organizationId, userId, action: 'category.updated', entity: 'product_category', entityId: id, before: category, after: updated })
    return updated
  }

  async removeCategory(organizationId: string, userId: string, id: string) {
    const category = await this.prisma.productCategory.findFirst({ where: { id, organizationId } })
    if (!category) throw new NotFoundException('Categoria não encontrada')

    await this.prisma.productCategory.delete({ where: { id } })
    await this.audit.log({ organizationId, userId, action: 'category.deleted', entity: 'product_category', entityId: id, before: category, severity: 'WARNING' })
  }

  // ─── Products ──────────────────────────────────────────────────────────────

  async findAll(organizationId: string, query?: { search?: string; status?: string; categoryId?: string; page?: number; limit?: number }) {
    const { search, status, categoryId, page = 1, limit = 20 } = query || {}
    const skip = (page - 1) * limit

    const where = {
      organizationId,
      ...(status && { status: status as any }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true, icon: true } },
          _count: { select: { plans: true } },
          plans: {
            where: { status: 'ACTIVE' },
            select: { prices: { select: { amount: true, currency: true } } },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ])

    // Surface the cheapest active price per product for the listing, then drop
    // the heavy plans/prices payload that was only needed for that calculation.
    const data = rows.map(({ plans, ...product }) => {
      const amounts = plans.flatMap((p) => p.prices.map((pr) => Number(pr.amount)))
      const lowestPrice = amounts.length ? Math.min(...amounts).toFixed(2) : null
      return { ...product, lowestPrice }
    })

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  async findOne(organizationId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId },
      include: {
        category: true,
        plans: {
          orderBy: [{ sortOrder: 'asc' }],
          include: { prices: { orderBy: { cycle: 'asc' } }, _count: { select: { addons: true } } },
        },
      },
    })

    if (!product) throw new NotFoundException('Produto não encontrado')
    return product
  }

  async create(organizationId: string, userId: string, dto: CreateProductDto) {
    const exists = await this.prisma.product.findUnique({
      where: { organizationId_slug: { organizationId, slug: dto.slug } },
    })
    if (exists) throw new ConflictException('Já existe um produto com este slug')

    const product = await this.prisma.product.create({
      data: { ...dto, organizationId },
    })

    await this.audit.log({ organizationId, userId, action: 'product.created', entity: 'product', entityId: product.id, after: product })
    return product
  }

  async update(organizationId: string, userId: string, id: string, dto: UpdateProductDto) {
    const product = await this.findOne(organizationId, id)

    if (dto.slug && dto.slug !== product.slug) {
      const exists = await this.prisma.product.findUnique({
        where: { organizationId_slug: { organizationId, slug: dto.slug } },
      })
      if (exists) throw new ConflictException('Já existe um produto com este slug')
    }

    const updated = await this.prisma.product.update({ where: { id }, data: dto })
    await this.audit.log({ organizationId, userId, action: 'product.updated', entity: 'product', entityId: id, before: product, after: updated })
    return updated
  }

  async remove(organizationId: string, userId: string, id: string) {
    const product = await this.findOne(organizationId, id)
    await this.prisma.product.delete({ where: { id } })
    await this.audit.log({ organizationId, userId, action: 'product.deleted', entity: 'product', entityId: id, before: product, severity: 'WARNING' })
  }

  /**
   * Deep-clones a product with all of its plans and prices. The copy starts
   * INACTIVE so it isn't sold before it has been reviewed, and gets fresh
   * organization-unique slugs.
   */
  async duplicate(organizationId: string, userId: string, id: string) {
    const source = await this.prisma.product.findFirst({
      where: { id, organizationId },
      include: { plans: { include: { prices: true } } },
    })
    if (!source) throw new NotFoundException('Produto não encontrado')

    const productSlug = await this.uniqueSlug(
      (slug) => this.prisma.product.findUnique({ where: { organizationId_slug: { organizationId, slug } } }).then(Boolean),
      source.slug,
    )

    const created = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          organizationId,
          categoryId: source.categoryId,
          name: `${source.name} (cópia)`,
          slug: productSlug,
          description: source.description,
          type: source.type,
          status: 'INACTIVE',
          features: source.features ?? Prisma.JsonNull,
          metadata: source.metadata ?? {},
          sortOrder: source.sortOrder,
        },
      })

      for (const plan of source.plans) {
        const planSlug = await this.uniqueSlug(
          (slug) => tx.plan.findUnique({ where: { organizationId_slug: { organizationId, slug } } }).then(Boolean),
          plan.slug,
        )
        await tx.plan.create({
          data: {
            organizationId,
            productId: product.id,
            name: plan.name,
            slug: planSlug,
            description: plan.description,
            status: plan.status,
            features: plan.features ?? Prisma.JsonNull,
            limits: plan.limits ?? Prisma.JsonNull,
            metadata: plan.metadata ?? {},
            sortOrder: plan.sortOrder,
            isPopular: plan.isPopular,
            prices: {
              create: plan.prices.map((pr) => ({
                currency: pr.currency,
                cycle: pr.cycle,
                amount: pr.amount,
                setupFee: pr.setupFee,
                trialDays: pr.trialDays,
                isDefault: pr.isDefault,
              })),
            },
          },
        })
      }

      return product
    })

    await this.audit.log({ organizationId, userId, action: 'product.duplicated', entity: 'product', entityId: created.id, after: created })
    return this.findOne(organizationId, created.id)
  }

  /** Finds a free "<base>-copia" / "<base>-copia-N" slug given an existence check. */
  private async uniqueSlug(exists: (slug: string) => Promise<boolean>, base: string): Promise<string> {
    let candidate = `${base}-copia`
    let i = 2
    while (await exists(candidate)) {
      candidate = `${base}-copia-${i}`
      i++
    }
    return candidate
  }

  // ─── Configurable Options ──────────────────────────────────────────────────

  private async assertProduct(organizationId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId },
      select: { id: true },
    })
    if (!product) throw new NotFoundException('Produto não encontrado')
    return product
  }

  private mapOptionValues(organizationId: string, values?: { label: string; priceModifier?: string; sortOrder?: number }[]) {
    return (values ?? []).map((v, i) => ({
      organizationId,
      label: v.label,
      priceModifier: parseSignedMoney(v.priceModifier ?? '0', 'ajuste de preço'),
      sortOrder: v.sortOrder ?? i,
    }))
  }

  async listOptions(organizationId: string, productId: string) {
    await this.assertProduct(organizationId, productId)
    return this.prisma.configurableOption.findMany({
      where: { organizationId, productId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { values: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
    })
  }

  async createOption(organizationId: string, userId: string, productId: string, dto: CreateConfigurableOptionDto) {
    await this.assertProduct(organizationId, productId)
    const values = this.mapOptionValues(organizationId, dto.values)

    const option = await this.prisma.configurableOption.create({
      data: {
        organizationId,
        productId,
        name: dto.name,
        type: dto.type ?? 'SELECT',
        required: dto.required ?? false,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? 'ACTIVE',
        ...(values.length && { values: { create: values } }),
      },
      include: { values: { orderBy: { sortOrder: 'asc' } } },
    })

    await this.audit.log({ organizationId, userId, action: 'option.created', entity: 'configurable_option', entityId: option.id, after: option })
    return option
  }

  async updateOption(organizationId: string, userId: string, optionId: string, dto: UpdateConfigurableOptionDto) {
    const option = await this.prisma.configurableOption.findFirst({ where: { id: optionId, organizationId } })
    if (!option) throw new NotFoundException('Opção não encontrada')

    await this.prisma.$transaction(async (tx) => {
      await tx.configurableOption.update({
        where: { id: optionId },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.type !== undefined && { type: dto.type }),
          ...(dto.required !== undefined && { required: dto.required }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(dto.status !== undefined && { status: dto.status }),
        },
      })

      if (dto.values !== undefined) {
        // Options aren't referenced by orders yet, so replacing the value set
        // wholesale keeps the code simple and predictable.
        await tx.configurableOptionValue.deleteMany({ where: { optionId } })
        const values = this.mapOptionValues(organizationId, dto.values)
        if (values.length) {
          await tx.configurableOptionValue.createMany({ data: values.map((v) => ({ ...v, optionId })) })
        }
      }
    })

    await this.audit.log({ organizationId, userId, action: 'option.updated', entity: 'configurable_option', entityId: optionId, before: option })
    return this.prisma.configurableOption.findFirst({
      where: { id: optionId },
      include: { values: { orderBy: { sortOrder: 'asc' } } },
    })
  }

  async removeOption(organizationId: string, userId: string, optionId: string) {
    const option = await this.prisma.configurableOption.findFirst({ where: { id: optionId, organizationId } })
    if (!option) throw new NotFoundException('Opção não encontrada')
    await this.prisma.configurableOption.delete({ where: { id: optionId } })
    await this.audit.log({ organizationId, userId, action: 'option.deleted', entity: 'configurable_option', entityId: optionId, before: option, severity: 'WARNING' })
  }
}
