import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { MailService } from '../mail/mail.service'
import { CreateTicketDto } from './dto/create-ticket.dto'
import { UpdateTicketDto } from './dto/update-ticket.dto'
import { Prisma } from '@prisma/client'

const TICKET_INCLUDE = {
  client: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { messages: true } },
} as const

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  private async nextNumber(orgId: string) {
    const count = await this.prisma.ticket.count({ where: { organizationId: orgId } })
    return count + 1
  }

  // ── Admin ────────────────────────────────────────────────────────────────

  async findAll(orgId: string, params: {
    status?: string; priority?: string; clientId?: string; page?: number; limit?: number
  }) {
    const { status, priority, clientId, page = 1, limit = 20 } = params
    const where: Prisma.TicketWhereInput = {
      organizationId: orgId,
      ...(status && { status: status as any }),
      ...(priority && { priority: priority as any }),
      ...(clientId && { clientId }),
    }

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: TICKET_INCLUDE,
      }),
      this.prisma.ticket.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(orgId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, organizationId: orgId },
      include: {
        ...TICKET_INCLUDE,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            client: { select: { id: true, name: true } },
          },
        },
      },
    })
    if (!ticket) throw new NotFoundException('Ticket não encontrado.')
    return ticket
  }

  async createByAdmin(orgId: string, dto: CreateTicketDto, userId: string) {
    const number = await this.nextNumber(orgId)
    return this.prisma.ticket.create({
      data: {
        organizationId: orgId,
        number,
        subject: dto.subject,
        priority: (dto.priority ?? 'MEDIUM') as any,
        category: dto.category,
        messages: { create: { userId, body: dto.body } },
      },
      include: TICKET_INCLUDE,
    })
  }

  async update(orgId: string, id: string, dto: UpdateTicketDto) {
    await this.findOne(orgId, id)
    return this.prisma.ticket.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status as any }),
        ...(dto.priority && { priority: dto.priority as any }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
        ...(['RESOLVED', 'CLOSED'].includes(dto.status ?? '') && { closedAt: new Date() }),
      },
      include: TICKET_INCLUDE,
    })
  }

  async addAdminMessage(orgId: string, ticketId: string, userId: string, body: string, isInternal = false) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, organizationId: orgId },
      include: { client: { select: { name: true, email: true } } },
    })
    if (!ticket) throw new NotFoundException('Ticket não encontrado.')

    const message = await this.prisma.ticketMessage.create({
      data: { ticketId, userId, body, isInternal },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    })
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'IN_PROGRESS', updatedAt: new Date() },
    })

    if (!isInternal && ticket.client?.email) {
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'
      this.mail.sendTicketReply(ticket.client.email, {
        clientName: ticket.client.name,
        ticketNumber: ticket.number,
        subject: ticket.subject,
        body,
        portalUrl: `${frontendUrl}/portal/support/${ticket.id}`,
      }).catch(() => {})
    }

    return message
  }

  // ── Portal (client-side) ─────────────────────────────────────────────────

  async findByClient(orgId: string, clientId: string) {
    return this.prisma.ticket.findMany({
      where: { organizationId: orgId, clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
    })
  }

  async findOneByClient(orgId: string, ticketId: string, clientId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, organizationId: orgId, clientId },
      include: {
        assignedTo: { select: { id: true, name: true } },
        messages: {
          where: { isInternal: false },
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true } },
            client: { select: { id: true, name: true } },
          },
        },
      },
    })
    if (!ticket) throw new NotFoundException('Ticket não encontrado.')
    return ticket
  }

  async createByClient(orgId: string, clientId: string, dto: CreateTicketDto) {
    const number = await this.nextNumber(orgId)
    const ticket = await this.prisma.ticket.create({
      data: {
        organizationId: orgId,
        clientId,
        number,
        subject: dto.subject,
        priority: (dto.priority ?? 'MEDIUM') as any,
        category: dto.category,
        messages: { create: { clientId, body: dto.body } },
      },
      include: { client: { select: { name: true, email: true } } },
    })

    if (ticket.client?.email) {
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'
      this.mail.sendTicketCreated(ticket.client.email, {
        clientName: ticket.client.name,
        ticketNumber: ticket.number,
        subject: ticket.subject,
        portalUrl: `${frontendUrl}/portal/support/${ticket.id}`,
      }).catch(() => {})
    }

    return ticket
  }

  async addClientMessage(orgId: string, ticketId: string, clientId: string, body: string) {
    const ticket = await this.findOneByClient(orgId, ticketId, clientId)
    const message = await this.prisma.ticketMessage.create({
      data: { ticketId, clientId, body },
      include: { client: { select: { id: true, name: true } } },
    })
    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'WAITING_CLIENT', updatedAt: new Date() },
    })
    return message
  }

  async closeByClient(orgId: string, ticketId: string, clientId: string) {
    await this.findOneByClient(orgId, ticketId, clientId)
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'CLOSED', closedAt: new Date() },
    })
  }
}
