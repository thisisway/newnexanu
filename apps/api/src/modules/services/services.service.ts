import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const SERVICE_INCLUDE = {
  client: { select: { id: true, name: true, email: true, phone: true } },
  plan: { select: { id: true, name: true, product: { select: { id: true, name: true } } } },
  planPrice: { select: { id: true, billingCycle: true, amount: true } },
  subscription: {
    select: { id: true, status: true, nextBillingDate: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
  },
  _count: { select: { invoices: true } },
} as const

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    orgId: string,
    params: { status?: string; clientId?: string; search?: string; page?: number; limit?: number },
  ) {
    const { status, clientId, search, page = 1, limit = 20 } = params

    const where: any = {
      organizationId: orgId,
      status: status ? (status as any) : { in: ['ACTIVE', 'SUSPENDED', 'CANCELLED'] },
      ...(clientId && { clientId }),
      ...(search && {
        OR: [
          { client: { name: { contains: search, mode: 'insensitive' } } },
          { client: { email: { contains: search, mode: 'insensitive' } } },
          { plan: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: SERVICE_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(orgId: string, id: string) {
    const svc = await this.prisma.order.findFirst({
      where: { id, organizationId: orgId },
      include: {
        ...SERVICE_INCLUDE,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, number: true, status: true, total: true, dueDate: true, createdAt: true },
        },
        orderAddons: {
          include: { addon: { select: { id: true, name: true } } },
        },
      },
    })
    if (!svc) throw new NotFoundException('Serviço não encontrado.')
    return svc
  }

  async stats(orgId: string) {
    const [active, suspended, cancelled, total] = await Promise.all([
      this.prisma.order.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
      this.prisma.order.count({ where: { organizationId: orgId, status: 'SUSPENDED' } }),
      this.prisma.order.count({ where: { organizationId: orgId, status: 'CANCELLED' } }),
      this.prisma.order.count({ where: { organizationId: orgId, status: { in: ['ACTIVE', 'SUSPENDED', 'CANCELLED'] } } }),
    ])
    return { active, suspended, cancelled, total }
  }

  async suspend(orgId: string, id: string) {
    const svc = await this.findOne(orgId, id)
    if (svc.status !== 'ACTIVE') throw new BadRequestException('Apenas serviços ativos podem ser suspensos.')
    return this.prisma.order.update({
      where: { id },
      data: { status: 'SUSPENDED' },
      include: SERVICE_INCLUDE,
    })
  }

  async reactivate(orgId: string, id: string) {
    const svc = await this.findOne(orgId, id)
    if (svc.status !== 'SUSPENDED') throw new BadRequestException('Apenas serviços suspensos podem ser reativados.')
    return this.prisma.order.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: SERVICE_INCLUDE,
    })
  }

  async cancel(orgId: string, id: string) {
    const svc = await this.findOne(orgId, id)
    if (svc.status === 'CANCELLED') throw new BadRequestException('Serviço já está cancelado.')
    return this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: SERVICE_INCLUDE,
    })
  }

  async updateNotes(orgId: string, id: string, notes: string) {
    await this.findOne(orgId, id)
    return this.prisma.order.update({
      where: { id },
      data: { notes },
      include: SERVICE_INCLUDE,
    })
  }
}
