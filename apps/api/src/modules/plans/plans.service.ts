import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { CreatePlanDto } from './dto/create-plan.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'
import { CreateAddonDto } from './dto/create-addon.dto'

@Injectable()
export class PlansService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

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
    const exists = await this.prisma.plan.findUnique({
      where: { organizationId_slug: { organizationId, slug: dto.slug } },
    })
    if (exists) throw new ConflictException('Já existe um plano com este slug')

    const { prices, ...planData } = dto

    const plan = await this.prisma.$transaction(async (tx) => {
      const created = await tx.plan.create({
        data: { ...planData, organizationId },
      })

      if (prices?.length) {
        await tx.planPrice.createMany({
          data: prices.map((p) => ({
            planId: created.id,
            cycle: p.cycle,
            amount: p.amount,
            setupFee: p.setupFee ?? '0',
            trialDays: p.trialDays ?? 0,
            isDefault: p.isDefault ?? false,
            currency: p.currency ?? 'BRL',
          })),
        })
      }

      return created
    })

    await this.audit.log({ organizationId, userId, action: 'plan.created', entity: 'plan', entityId: plan.id, after: plan })
    return this.findOne(organizationId, plan.id)
  }

  async update(organizationId: string, userId: string, id: string, dto: UpdatePlanDto) {
    const plan = await this.findOne(organizationId, id)
    const { prices, ...planData } = dto

    if (planData.slug && planData.slug !== plan.slug) {
      const exists = await this.prisma.plan.findUnique({
        where: { organizationId_slug: { organizationId, slug: planData.slug } },
      })
      if (exists) throw new ConflictException('Já existe um plano com este slug')
    }

    const updated = await this.prisma.plan.update({ where: { id }, data: planData })
    await this.audit.log({ organizationId, userId, action: 'plan.updated', entity: 'plan', entityId: id, before: plan, after: updated })
    return this.findOne(organizationId, id)
  }

  async remove(organizationId: string, userId: string, id: string) {
    const plan = await this.findOne(organizationId, id)
    await this.prisma.plan.delete({ where: { id } })
    await this.audit.log({ organizationId, userId, action: 'plan.deleted', entity: 'plan', entityId: id, before: plan, severity: 'WARNING' })
  }

  // ─── Prices ────────────────────────────────────────────────────────────────

  async addPrice(organizationId: string, planId: string, dto: any) {
    await this.findOne(organizationId, planId)
    return this.prisma.planPrice.create({ data: { planId, ...dto } })
  }

  async removePrice(organizationId: string, planId: string, priceId: string) {
    await this.findOne(organizationId, planId)
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
    const addon = await this.prisma.addon.create({
      data: { ...dto, organizationId },
    })
    await this.audit.log({ organizationId, userId, action: 'addon.created', entity: 'addon', entityId: addon.id, after: addon })
    return addon
  }

  async updateAddon(organizationId: string, userId: string, id: string, dto: Partial<CreateAddonDto>) {
    const addon = await this.prisma.addon.findFirst({ where: { id, organizationId } })
    if (!addon) throw new NotFoundException('Addon não encontrado')

    const updated = await this.prisma.addon.update({ where: { id }, data: dto })
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
