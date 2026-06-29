import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

type WebhookStatus = 'ACTIVE' | 'INACTIVE'

export const WEBHOOK_EVENTS = [
  'order.created', 'order.activated', 'order.cancelled',
  'invoice.created', 'invoice.paid', 'invoice.overdue',
  'subscription.renewed', 'subscription.suspended', 'subscription.cancelled',
  'client.created', 'client.updated',
  'ticket.created', 'ticket.closed',
  'payment.received', 'payment.failed',
]

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { organizationId },
      include: { _count: { select: { deliveries: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return { data: webhooks, events: WEBHOOK_EVENTS }
  }

  async findOne(organizationId: string, id: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, organizationId },
      include: {
        deliveries: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })
    if (!webhook) throw new NotFoundException('Webhook not found')
    return webhook
  }

  async create(organizationId: string, data: {
    name: string
    url: string
    secret?: string
    events: string[]
  }) {
    return this.prisma.webhook.create({
      data: { ...data, organizationId },
    })
  }

  async update(organizationId: string, id: string, data: {
    name?: string
    url?: string
    secret?: string
    events?: string[]
    status?: WebhookStatus
  }) {
    await this.findOne(organizationId, id)
    return this.prisma.webhook.update({ where: { id }, data })
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id)
    await this.prisma.webhook.delete({ where: { id } })
  }

  async test(organizationId: string, id: string) {
    const webhook = await this.findOne(organizationId, id)
    const payload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: { message: 'Teste de webhook do Nexano', webhookId: id },
    }
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Nexano-Event': 'webhook.test',
          ...(webhook.secret ? { 'X-Nexano-Secret': webhook.secret } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout))
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookId: id,
          event: 'webhook.test',
          payload,
          statusCode: res.status,
          success: res.ok,
        },
      })
      await this.prisma.webhook.update({
        where: { id },
        data: {
          lastTriggeredAt: new Date(),
          failCount: res.ok ? 0 : { increment: 1 },
        },
      })
      return { success: res.ok, statusCode: res.status, deliveryId: delivery.id }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId: id,
          event: 'webhook.test',
          payload,
          success: false,
          response: message,
        },
      })
      await this.prisma.webhook.update({
        where: { id },
        data: { failCount: { increment: 1 } },
      })
      return { success: false, error: message }
    }
  }
}
