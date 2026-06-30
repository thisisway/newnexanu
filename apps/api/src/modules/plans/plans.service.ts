import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { BillingCycle } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { CreatePlanDto } from './dto/create-plan.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'
import { CreatePriceDto } from './dto/create-price.dto'
import { CreateAddonDto } from './dto/create-addon.dto'
import { parseMoney } from '../../common/utils/money'

interface IncomingPrice {
  cycle: BillingCycle
  amount: string
  setupFee?: string
  trialDays?: number
  isDefault?: boolean
  currency?: string
}

interface PreparedPrice {
  cycle: BillingCycle
  amount: string
  setupFee: string
  trialDays: number
  isDefault: boolean
  currency: string
}

@Injectable()
export class PlansService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Validates and normalizes a set of incoming prices: converts comma decimals,
   * rejects negative/invalid values, forbids duplicate cycles within the same
   * currency and guarantees exactly one default price.
   */
  private preparePrices(prices: IncomingPrice[]): PreparedPrice[] {
    if (!prices.length) return []

    const seen = new Set<string>()
    const hasExplicitDefault = prices.some((p) => p.isDefault)
    let defaultAssigned = false

    return prices.map((p, index) => {
      const currency = p.currency ?? 'BRL'
      const key = `${currency}:${p.cycle}`
      if (seen.has(key)) {
        throw new ConflictException(`Há mais de um preço para o ciclo ${p.cycle}.`)
      }
      seen.add(key)

      let isDefault = false
      if (hasExplicitDefault) {
        if (p.isDefault && !defaultAssigned) {
          isDefault = true
          defaultAssigned = true
        }
      } else if (index === 0) {
        isDefault = true
      }

      return {
        cycle: p.cycle,
        amount: parseMoney(p.amount, 'valor'),
        setupFee: parseMoney(p.setupFee ?? '0', 'valor da taxa de instalação'),
        trialDays: p.trialDays ?? 0,
        currency,
        isDefault,
      }
    })
  }

  // ─── Plans ─────────────────────────────────────────────────────────────────

  async findAll(organizationId: string, productId?: string) {
    return this.prisma.plan.findMany({
      where: { organizationId, ...(productId && { productId }) },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        product: { select: { id: true, name: true, type: true } },
        prices: { orderBy: { cycle: 'asc' } },
        _count: { select: { addons: true } },
      },
    })
  }

  async findOne(organizationId: string, id: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id, organizationId },
      include: {
        product: true,
        prices: { orderBy: { cycle: 'asc' } },
        addons: { where: { status: 'ACTIVE' } },
      },
    })
    if (!plan) throw new NotFoundException('Plano não encontrado')
    return plan
  }

  async create(organizationId: string, userId: string, dto: CreatePlanDto) {
    // The plan must be attached to a product of the caller's own organization.
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, organizationId },
      select: { id: true },
    })
    if (!product) throw new NotFoundException('Produto não encontrado nesta organização')

    const exists = await this.prisma.plan.findUnique({
      where: { organizationId_slug: { organizationId, slug: dto.slug } },
    })
    if (exists) throw new ConflictException('Já existe um plano com este slug')

    const { prices, ...planData } = dto
    const preparedPrices = this.preparePrices(prices ?? [])

    const plan = await this.prisma.$transaction(async (tx) => {
      const created = await tx.plan.create({
        data: { ...planData, organizationId },
      })

      if (preparedPrices.length) {
        await tx.planPrice.createMany({
          data: preparedPrices.map((p) => ({ planId: created.id, ...p })),
        })
      }

      return created
    })

    await this.audit.log({ organizationId, userId, action: 'plan.created', entity: 'plan', entityId: plan.id, after: plan })
    return this.findOne(organizationId, plan.id)
  }

  async update(organizationId: string, userId: string, id: string, dto: UpdatePlanDto) {
    const plan = await this.findOne(organizationId, id)
    // productId is intentionally not updatable here — a plan stays under its product.
    const { prices, productId: _productId, ...planData } = dto

    if (planData.slug && planData.slug !== plan.slug) {
      const exists = await this.prisma.plan.findUnique({
        where: { organizationId_slug: { organizationId, slug: planData.slug } },
      })
      if (exists) throw new ConflictException('Já existe um plano com este slug')
    }

    const preparedPrices = prices !== undefined
      ? this.preparePrices(prices as IncomingPrice[])
      : undefined

    await this.prisma.$transaction(async (tx) => {
      await tx.plan.update({ where: { id }, data: planData })

      if (preparedPrices !== undefined) {
        // Upsert the incoming prices and drop the removed ones — but never delete
        // a price that is already referenced by an order (keeps history intact).
        const keep = new Set<string>()
        for (const p of preparedPrices) {
          keep.add(`${p.currency}:${p.cycle}`)
          await tx.planPrice.upsert({
            where: { planId_currency_cycle: { planId: id, currency: p.currency, cycle: p.cycle } },
            create: { planId: id, ...p },
            update: { amount: p.amount, setupFee: p.setupFee, trialDays: p.trialDays, isDefault: p.isDefault },
          })
        }

        const existing = await tx.planPrice.findMany({
          where: { planId: id },
          include: { _count: { select: { orders: true } } },
        })
        for (const ex of existing) {
          if (!keep.has(`${ex.currency}:${ex.cycle}`) && ex._count.orders === 0) {
            await tx.planPrice.delete({ where: { id: ex.id } })
          }
        }
      }
    })

    await this.audit.log({ organizationId, userId, action: 'plan.updated', entity: 'plan', entityId: id, before: plan })
    return this.findOne(organizationId, id)
  }

  async remove(organizationId: string, userId: string, id: string) {
    const plan = await this.findOne(organizationId, id)
    await this.prisma.plan.delete({ where: { id } })
    await this.audit.log({ organizationId, userId, action: 'plan.deleted', entity: 'plan', entityId: id, before: plan, severity: 'WARNING' })
  }

  // ─── Prices ────────────────────────────────────────────────────────────────

  async addPrice(organizationId: string, planId: string, dto: CreatePriceDto) {
    await this.findOne(organizationId, planId) // ensures the plan is in this org
    const currency = dto.currency ?? 'BRL'

    const duplicate = await this.prisma.planPrice.findUnique({
      where: { planId_currency_cycle: { planId, currency, cycle: dto.cycle } },
    })
    if (duplicate) throw new ConflictException('Já existe um preço para este ciclo.')

    const amount = parseMoney(dto.amount, 'valor')
    const setupFee = parseMoney(dto.setupFee ?? '0', 'valor da taxa de instalação')

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.planPrice.updateMany({ where: { planId }, data: { isDefault: false } })
      }
      return tx.planPrice.create({
        data: {
          planId,
          currency,
          cycle: dto.cycle,
          amount,
          setupFee,
          trialDays: dto.trialDays ?? 0,
          isDefault: dto.isDefault ?? false,
        },
      })
    })
  }

  async removePrice(organizationId: string, planId: string, priceId: string) {
    await this.findOne(organizationId, planId)
    const price = await this.prisma.planPrice.findFirst({
      where: { id: priceId, planId },
      include: { _count: { select: { orders: true } } },
    })
    if (!price) throw new NotFoundException('Preço não encontrado')
    if (price._count.orders > 0) {
      throw new ConflictException('Este preço já foi usado em pedidos e não pode ser removido.')
    }
    await this.prisma.planPrice.delete({ where: { id: priceId } })
  }

  // ─── Addons ────────────────────────────────────────────────────────────────

  async findAllAddons(organizationId: string, planId?: string) {
    return this.prisma.addon.findMany({
      where: { organizationId, ...(planId && { planId }) },
      orderBy: { createdAt: 'desc' },
      include: { plan: { select: { id: true, name: true } } },
    })
  }

  async createAddon(organizationId: string, userId: string, dto: CreateAddonDto) {
    if (dto.planId) {
      const plan = await this.prisma.plan.findFirst({ where: { id: dto.planId, organizationId }, select: { id: true } })
      if (!plan) throw new NotFoundException('Plano não encontrado nesta organização')
    }
    const addon = await this.prisma.addon.create({
      data: {
        ...dto,
        price: parseMoney(dto.price, 'valor'),
        setupFee: parseMoney(dto.setupFee ?? '0', 'valor da taxa de instalação'),
        organizationId,
      },
    })
    await this.audit.log({ organizationId, userId, action: 'addon.created', entity: 'addon', entityId: addon.id, after: addon })
    return addon
  }

  async updateAddon(organizationId: string, userId: string, id: string, dto: Partial<CreateAddonDto>) {
    const addon = await this.prisma.addon.findFirst({ where: { id, organizationId } })
    if (!addon) throw new NotFoundException('Addon não encontrado')

    const updated = await this.prisma.addon.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.price !== undefined && { price: parseMoney(dto.price, 'valor') }),
        ...(dto.setupFee !== undefined && { setupFee: parseMoney(dto.setupFee, 'valor da taxa de instalação') }),
      },
    })
    await this.audit.log({ organizationId, userId, action: 'addon.updated', entity: 'addon', entityId: id, before: addon, after: updated })
    return updated
  }

  async removeAddon(organizationId: string, userId: string, id: string) {
    const addon = await this.prisma.addon.findFirst({ where: { id, organizationId } })
    if (!addon) throw new NotFoundException('Addon não encontrado')

    await this.prisma.addon.delete({ where: { id } })
    await this.audit.log({ organizationId, userId, action: 'addon.deleted', entity: 'addon', entityId: id, before: addon, severity: 'WARNING' })
  }
}
