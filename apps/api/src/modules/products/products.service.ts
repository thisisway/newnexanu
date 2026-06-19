import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { CreateCategoryDto } from './dto/create-category.dto'

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

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true, icon: true } },
          _count: { select: { plans: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ])

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
}
