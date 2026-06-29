import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(organizationId: string) {
    const now = new Date()

    // Promote past-due OPEN invoices to OVERDUE so the count and the filter link stay in sync
    await this.prisma.invoice.updateMany({
      where: { organizationId, status: 'OPEN', dueDate: { lt: now } },
      data: { status: 'OVERDUE' },
    })

    const [
      activeClients,
      openInvoices,
      overdueInvoices,
      pendingOrders,
      activeSubscriptions,
      openTickets,
      activeOrderAmounts,
      recentOrders,
    ] = await Promise.all([
      this.prisma.client.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.invoice.count({ where: { organizationId, status: 'OPEN' } }),
      this.prisma.invoice.count({ where: { organizationId, status: 'OVERDUE' } }),
      this.prisma.order.count({ where: { organizationId, status: 'PENDING' } }),
      this.prisma.subscription.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.ticket.count({ where: { organizationId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
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
      openTickets,
      recentOrders,
    }
  }

  async getReports(organizationId: string) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const [
      totalClients,
      newClientsThisMonth,
      newClientsLastMonth,
      totalPaidRevenue,
      revenueThisMonth,
      revenueLastMonth,
      invoicesByStatus,
      topOrders,
      activeOrderAmounts,
    ] = await Promise.all([
      this.prisma.client.count({ where: { organizationId } }),
      this.prisma.client.count({ where: { organizationId, createdAt: { gte: startOfMonth } } }),
      this.prisma.client.count({ where: { organizationId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      this.prisma.payment.aggregate({
        where: { organizationId, status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { organizationId, status: 'PAID', paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { organizationId, status: 'PAID', paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
      this.prisma.invoice.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: true,
      }),
      this.prisma.order.findMany({
        where: { organizationId, status: 'ACTIVE' },
        orderBy: { total: 'desc' },
        take: 5,
        include: {
          plan: { select: { name: true } },
          client: { select: { name: true } },
        },
      }),
      this.prisma.order.findMany({
        where: { organizationId, status: 'ACTIVE' },
        select: { total: true, billingCycle: true },
      }),
    ])

    const mrr = activeOrderAmounts.reduce((sum, o) => {
      return sum + this.toMonthlyValue(Number(o.total), o.billingCycle)
    }, 0)

    const invoiceStats = Object.fromEntries(
      invoicesByStatus.map((r) => [r.status, r._count]),
    )

    return {
      mrr,
      arr: mrr * 12,
      totalClients,
      newClientsThisMonth,
      newClientsLastMonth,
      totalPaidRevenue: Number(totalPaidRevenue._sum.amount ?? 0),
      revenueThisMonth: Number(revenueThisMonth._sum.amount ?? 0),
      revenueLastMonth: Number(revenueLastMonth._sum.amount ?? 0),
      invoiceStats,
      topOrders,
    }
  }

  async search(organizationId: string, q: string) {
    if (!q || q.trim().length < 2) return { clients: [], invoices: [], tickets: [] }

    const term = q.trim()
    const contains = { contains: term, mode: 'insensitive' as const }

    const [clients, invoices, tickets] = await Promise.all([
      this.prisma.client.findMany({
        where: {
          organizationId,
          OR: [{ name: contains }, { email: contains }, { document: contains }],
        },
        select: { id: true, name: true, email: true, status: true },
        take: 5,
      }),
      this.prisma.invoice.findMany({
        where: {
          organizationId,
          OR: [{ number: contains }, { client: { name: contains } }],
        },
        select: { id: true, number: true, status: true, total: true, client: { select: { name: true } } },
        take: 5,
      }),
      this.prisma.ticket.findMany({
        where: {
          organizationId,
          OR: [{ subject: contains }, { client: { name: contains } }],
        },
        select: { id: true, number: true, subject: true, status: true, client: { select: { name: true } } },
        take: 5,
      }),
    ])

    return { clients, invoices, tickets }
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
