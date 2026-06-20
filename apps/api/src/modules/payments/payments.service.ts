import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { Prisma } from '@prisma/client'

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, organizationId },
    })
    if (!invoice) throw new NotFoundException('Fatura não encontrada.')
    if (invoice.status === 'PAID') throw new BadRequestException('Fatura já está paga.')
    if (invoice.status === 'CANCELLED') throw new BadRequestException('Fatura cancelada.')

    // Simulate PIX code generation (integrate with real gateway later)
    const pixCode = dto.method === 'PIX'
      ? `00020126580014BR.GOV.BCB.PIX0136${organizationId}5204000053039865802BR5925NEXANO6009SAO PAULO62070503***6304${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
      : undefined

    const pixExpiry = dto.method === 'PIX'
      ? new Date(Date.now() + 30 * 60 * 1000) // 30 min
      : undefined

    const payment = await this.prisma.payment.create({
      data: {
        organizationId,
        invoiceId: dto.invoiceId,
        clientId: invoice.clientId,
        method: dto.method,
        status: 'PENDING',
        amount: invoice.total,
        currency: invoice.currency,
        pixCode,
        pixExpiry,
      },
      include: {
        invoice: { select: { id: true, number: true, total: true } },
      },
    })

    return payment
  }

  async findAll(
    organizationId: string,
    params: { invoiceId?: string; status?: string; page?: number; limit?: number },
  ) {
    const { invoiceId, status, page = 1, limit = 20 } = params
    const where: Prisma.PaymentWhereInput = {
      organizationId,
      ...(invoiceId && { invoiceId }),
      ...(status && { status: status as any }),
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true } },
          invoice: { select: { id: true, number: true, total: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(organizationId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
        invoice: { include: { items: true } },
      },
    })
    if (!payment) throw new NotFoundException('Pagamento não encontrado.')
    return payment
  }

  // Called by webhook or manually to confirm payment
  async confirm(organizationId: string, id: string) {
    const payment = await this.findOne(organizationId, id)
    if (payment.status === 'PAID') throw new BadRequestException('Pagamento já confirmado.')

    return this.prisma.$transaction(async (tx) => {
      const confirmed = await tx.payment.update({
        where: { id },
        data: { status: 'PAID', paidAt: new Date() },
      })

      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: 'PAID', paidAt: new Date() },
      })

      // Activate order if pending
      const invoice = await tx.invoice.findUnique({
        where: { id: payment.invoiceId },
        select: { orderId: true },
      })
      if (invoice?.orderId) {
        const order = await tx.order.findUnique({
          where: { id: invoice.orderId },
          select: { status: true, billingCycle: true, clientId: true },
        })
        if (order?.status === 'PENDING') {
          const now = new Date()
          await tx.order.update({
            where: { id: invoice.orderId },
            data: { status: 'ACTIVE', activatedAt: now },
          })
        }
      }

      return confirmed
    })
  }
}
