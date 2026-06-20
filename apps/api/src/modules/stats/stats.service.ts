import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(organizationId: string) {
    const now = new Date()

    const [
      activeClients,
      openInvoices,
      overdueInvoices,
      pendingOrders,
      activeSubscriptions,
      activeOrderAmounts,
      recentOrders,
    ] = await Promise.all([
      this.prisma.client.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.invoice.count({ where: { organizationId, status: 'OPEN' } }),
      this.prisma.invoice.count({
        where: { organizationId, status: 'OPEN', dueDate: { lt: now } },
      }),
      this.prisma.order.count({ where: { organizationId, status: 'PENDING' } }),
      this.prisma.subscription.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.order.findMany({
        where: { organizationId, status: 'ACTIVE' },
        select: { total: true, billingCycle: true },
      }),
      this.prisma.order.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          client: { select: { id: true, name: true } },
          plan: { select: { name: true } },
        },
      }),
    ])

    const mrr = activeOrderAmounts.reduce((sum, o) => {
      return sum + this.toMonthlyValue(Number(o.total), o.billingCycle)
    }, 0)

    return {
      mrr,
      activeClients,
      openInvoices,
      overdueInvoices,
      pendingOrders,
      activeSubscriptions,
      recentOrders,
    }
  }

  private toMonthlyValue(amount: number, cycle: string): number {
    switch (cycle) {
      case 'MONTHLY': return amount
      case 'QUARTERLY': return amount / 3
      case 'SEMIANNUAL': return amount / 6
      case 'ANNUAL': return amount / 12
      case 'BIANNUAL': return amount / 24
      default: return 0
    }
  }
}
