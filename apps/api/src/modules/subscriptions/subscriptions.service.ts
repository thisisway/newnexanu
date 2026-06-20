import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    params: { clientId?: string; status?: string; page?: number; limit?: number },
  ) {
    const { clientId, status, page = 1, limit = 20 } = params
    const where: Prisma.SubscriptionWhereInput = {
      organizationId,
      ...(clientId && { clientId }),
      ...(status && { status: status as any }),
    }

    const [data, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, email: true } },
          order: {
            select: {
              id: true,
              billingCycle: true,
              total: true,
              plan: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.subscription.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(organizationId: string, id: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
        order: {
          include: {
            plan: true,
            planPrice: true,
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
    if (!sub) throw new NotFoundException('Assinatura não encontrada.')
    return sub
  }

  async cancel(organizationId: string, id: string, atPeriodEnd: boolean) {
    const sub = await this.findOne(organizationId, id)
    if (sub.status === 'CANCELLED')
      throw new BadRequestException('Assinatura já cancelada.')

    if (atPeriodEnd) {
      return this.prisma.subscription.update({
        where: { id },
        data: { cancelAtPeriodEnd: true },
      })
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelAtPeriodEnd: false },
      })
      await tx.order.update({
        where: { id: sub.orderId },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      })
      return { success: true }
    })
  }

  async suspend(organizationId: string, id: string) {
    const sub = await this.findOne(organizationId, id)
    if (sub.status !== 'ACTIVE')
      throw new BadRequestException('Apenas assinaturas ativas podem ser suspensas.')

    return this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({ where: { id }, data: { status: 'SUSPENDED' } })
      await tx.order.update({ where: { id: sub.orderId }, data: { status: 'SUSPENDED' } })
      return { success: true }
    })
  }

  async reactivate(organizationId: string, id: string) {
    const sub = await this.findOne(organizationId, id)
    if (sub.status !== 'SUSPENDED')
      throw new BadRequestException('Apenas assinaturas suspensas podem ser reativadas.')

    return this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({ where: { id }, data: { status: 'ACTIVE', cancelAtPeriodEnd: false } })
      await tx.order.update({ where: { id: sub.orderId }, data: { status: 'ACTIVE' } })
      return { success: true }
    })
  }
}
