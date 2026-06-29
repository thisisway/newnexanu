import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PortalService {
  constructor(private prisma: PrismaService) {}

  private async findClientByUser(userId: string, orgId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
    if (!user) throw new NotFoundException('Usuário não encontrado.')

    const client = await this.prisma.client.findFirst({
      where: { organizationId: orgId, email: user.email },
    })
    if (!client) throw new NotFoundException('Perfil de cliente não encontrado para este usuário.')
    return client
  }

  async getProfile(userId: string, orgId: string) {
    return this.findClientByUser(userId, orgId)
  }

  async getDashboard(userId: string, orgId: string) {
    const client = await this.findClientByUser(userId, orgId)

    const [openInvoices, activeOrders, openTickets, recentInvoices] = await Promise.all([
      this.prisma.invoice.count({
        where: { organizationId: orgId, clientId: client.id, status: { in: ['OPEN', 'OVERDUE'] } },
      }),
      this.prisma.order.count({
        where: { organizationId: orgId, clientId: client.id, status: 'ACTIVE' },
      }),
      this.prisma.ticket.count({
        where: { organizationId: orgId, clientId: client.id, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT'] } },
      }),
      this.prisma.invoice.findMany({
        where: { organizationId: orgId, clientId: client.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { payments: { select: { id: true, status: true } } },
      }),
    ])

    return { client, openInvoices, activeOrders, openTickets, recentInvoices }
  }

  async getInvoices(userId: string, orgId: string, params: { status?: string; page?: number; limit?: number }) {
    const client = await this.findClientByUser(userId, orgId)
    const { status, page = 1, limit = 20 } = params

    const statuses = status ? status.split(',').map((s) => s.trim()).filter(Boolean) : []
    const where = {
      organizationId: orgId,
      clientId: client.id,
      ...(statuses.length === 1 && { status: statuses[0] as any }),
      ...(statuses.length > 1 && { status: { in: statuses as any[] } }),
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.invoice.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getOrders(userId: string, orgId: string) {
    const client = await this.findClientByUser(userId, orgId)

    return this.prisma.order.findMany({
      where: { organizationId: orgId, clientId: client.id },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: { select: { id: true, name: true } },
        subscription: { select: { id: true, status: true, nextBillingDate: true, currentPeriodEnd: true } },
        _count: { select: { invoices: true } },
      },
    })
  }

  async assertInvoiceOwner(userId: string, orgId: string, invoiceId: string) {
    const client = await this.findClientByUser(userId, orgId)
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
      select: { clientId: true },
    })
    if (!invoice) throw new NotFoundException('Fatura não encontrada.')
    if (invoice.clientId !== client.id) throw new ForbiddenException('Acesso negado.')
    return client
  }

  async getDomains(userId: string, orgId: string) {
    const client = await this.findClientByUser(userId, orgId)

    const domains = await this.prisma.domain.findMany({
      where: { organizationId: orgId, clientId: client.id },
      orderBy: [{ expiresAt: 'asc' }, { name: 'asc' }],
    })

    return { data: domains, total: domains.length }
  }
}
