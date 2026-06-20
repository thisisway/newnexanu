import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    params: { clientId?: string; status?: string; page?: number; limit?: number },
  ) {
    const { clientId, status, page = 1, limit = 20 } = params
    const where: Prisma.InvoiceWhereInput = {
      organizationId,
      ...(clientId && { clientId }),
      ...(status && { status: status as any }),
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, email: true } },
          items: true,
          payments: { select: { id: true, status: true, amount: true, method: true } },
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(organizationId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
        order: { select: { id: true, status: true } },
        subscription: { select: { id: true, status: true } },
        items: true,
        payments: true,
      },
    })
    if (!invoice) throw new NotFoundException('Fatura não encontrada.')
    return invoice
  }

  async markPaid(organizationId: string, id: string) {
    const invoice = await this.findOne(organizationId, id)
    if (invoice.status === 'PAID')
      throw new BadRequestException('Fatura já está paga.')

    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    })
  }

  async cancel(organizationId: string, id: string) {
    const invoice = await this.findOne(organizationId, id)
    if (['PAID', 'CANCELLED'].includes(invoice.status))
      throw new BadRequestException('Não é possível cancelar esta fatura.')

    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })
  }

  async getOverdue(organizationId: string) {
    const now = new Date()
    return this.prisma.invoice.findMany({
      where: { organizationId, status: 'OPEN', dueDate: { lt: now } },
      include: { client: { select: { id: true, name: true, email: true } } },
      orderBy: { dueDate: 'asc' },
    })
  }
}
