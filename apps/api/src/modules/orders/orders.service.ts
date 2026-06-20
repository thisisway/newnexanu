import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'
import { Prisma } from '@prisma/client'

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateOrderDto) {
    const planPrice = await this.prisma.planPrice.findFirst({
      where: { id: dto.planPriceId, planId: dto.planId },
      include: { plan: true },
    })
    if (!planPrice) throw new NotFoundException('Preço do plano não encontrado.')

    const quantity = dto.quantity ?? 1
    const unitPrice = planPrice.amount
    const setupFee = planPrice.setupFee
    const total = (Number(unitPrice) * quantity) + Number(setupFee)

    const order = await this.prisma.order.create({
      data: {
        organizationId,
        clientId: dto.clientId,
        planId: dto.planId,
        planPriceId: dto.planPriceId,
        billingCycle: dto.billingCycle,
        quantity,
        unitPrice,
        setupFee,
        discount: 0,
        total,
        notes: dto.notes,
        orderAddons: dto.addons?.length
          ? {
              create: await Promise.all(
                dto.addons.map(async (a) => {
                  const addon = await this.prisma.addon.findUnique({ where: { id: a.addonId } })
                  if (!addon) throw new NotFoundException(`Addon ${a.addonId} não encontrado.`)
                  return { addonId: a.addonId, quantity: a.quantity, price: addon.price }
                }),
              ),
            }
          : undefined,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true } },
        planPrice: true,
        orderAddons: { include: { addon: true } },
      },
    })

    // Auto-generate invoice for setup fee + first period
    await this.generateInvoice(organizationId, order.id)

    return order
  }

  async findAll(
    organizationId: string,
    params: { clientId?: string; status?: string; page?: number; limit?: number },
  ) {
    const { clientId, status, page = 1, limit = 20 } = params
    const where: Prisma.OrderWhereInput = {
      organizationId,
      ...(clientId && { clientId }),
      ...(status && { status: status as any }),
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, email: true } },
          plan: { select: { id: true, name: true } },
          planPrice: { select: { cycle: true, amount: true } },
          subscription: { select: { id: true, status: true } },
          _count: { select: { invoices: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(organizationId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, organizationId },
      include: {
        client: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, slug: true } },
        planPrice: true,
        orderAddons: { include: { addon: true } },
        subscription: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: { payments: { select: { id: true, status: true, amount: true, method: true } } },
        },
      },
    })
    if (!order) throw new NotFoundException('Pedido não encontrado.')
    return order
  }

  async update(organizationId: string, id: string, dto: UpdateOrderDto) {
    await this.findOne(organizationId, id)
    return this.prisma.order.update({
      where: { id },
      data: dto,
    })
  }

  async activate(organizationId: string, id: string) {
    const order = await this.findOne(organizationId, id)
    if (order.status !== 'PENDING')
      throw new BadRequestException('Apenas pedidos pendentes podem ser ativados.')

    const now = new Date()
    const nextBilling = this.getNextBillingDate(now, order.billingCycle)

    return this.prisma.$transaction(async (tx) => {
      const activated = await tx.order.update({
        where: { id },
        data: { status: 'ACTIVE', activatedAt: now },
      })

      if (order.billingCycle !== 'ONE_TIME') {
        await tx.subscription.create({
          data: {
            organizationId,
            orderId: id,
            clientId: order.clientId,
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: nextBilling,
            nextBillingDate: nextBilling,
          },
        })
      }

      return activated
    })
  }

  async cancel(organizationId: string, id: string) {
    const order = await this.findOne(organizationId, id)
    if (order.status === 'CANCELLED')
      throw new BadRequestException('Pedido já está cancelado.')

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      })

      if (order.subscription) {
        await tx.subscription.update({
          where: { id: order.subscription.id },
          data: { status: 'CANCELLED', cancelledAt: new Date(), cancelAtPeriodEnd: false },
        })
      }

      return { success: true }
    })
  }

  private async generateInvoice(organizationId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        plan: true,
        planPrice: true,
        orderAddons: { include: { addon: true } },
      },
    })
    if (!order) return

    const count = await this.prisma.invoice.count({ where: { organizationId } })
    const number = `INV-${String(count + 1).padStart(5, '0')}`
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)

    const items: Prisma.InvoiceItemCreateManyInvoiceInput[] = [
      {
        description: `${order.plan.name} — ${order.planPrice.cycle}`,
        quantity: order.quantity,
        unitPrice: order.unitPrice,
        discount: 0,
        total: Number(order.unitPrice) * order.quantity,
      },
    ]

    if (Number(order.setupFee) > 0) {
      items.push({
        description: 'Taxa de setup',
        quantity: 1,
        unitPrice: order.setupFee,
        discount: 0,
        total: Number(order.setupFee),
      })
    }

    for (const oa of order.orderAddons) {
      items.push({
        description: oa.addon.name,
        quantity: oa.quantity,
        unitPrice: oa.price,
        discount: 0,
        total: Number(oa.price) * oa.quantity,
      })
    }

    const subtotal = items.reduce((s, i) => s + Number(i.total), 0)

    await this.prisma.invoice.create({
      data: {
        organizationId,
        clientId: order.clientId,
        orderId,
        number,
        status: 'OPEN',
        subtotal,
        discount: 0,
        tax: 0,
        total: subtotal,
        dueDate,
        items: { createMany: { data: items } },
      },
    })
  }

  private getNextBillingDate(from: Date, cycle: string): Date {
    const d = new Date(from)
    switch (cycle) {
      case 'MONTHLY': d.setMonth(d.getMonth() + 1); break
      case 'QUARTERLY': d.setMonth(d.getMonth() + 3); break
      case 'SEMIANNUAL': d.setMonth(d.getMonth() + 6); break
      case 'ANNUAL': d.setFullYear(d.getFullYear() + 1); break
      case 'BIANNUAL': d.setFullYear(d.getFullYear() + 2); break
      default: d.setMonth(d.getMonth() + 1)
    }
    return d
  }
}
