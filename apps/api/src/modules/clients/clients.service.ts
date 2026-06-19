import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { CreateContactDto } from './dto/create-contact.dto'
import { CreateNoteDto } from './dto/create-note.dto'
import { ListClientsDto } from './dto/list-clients.dto'

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(organizationId: string, query: ListClientsDto) {
    const { search, status, type, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit

    const where = {
      organizationId,
      ...(status && { status }),
      ...(type && { type }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { document: { contains: search } },
          { phone: { contains: search } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { contacts: true, clientNotes: true } } },
      }),
      this.prisma.client.count({ where }),
    ])

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async findOne(organizationId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, organizationId },
      include: {
        contacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        clientNotes: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        _count: true,
      },
    })

    if (!client) throw new NotFoundException('Cliente não encontrado')
    return client
  }

  async create(organizationId: string, userId: string, dto: CreateClientDto) {
    const exists = await this.prisma.client.findUnique({
      where: { organizationId_email: { organizationId, email: dto.email } },
    })
    if (exists) throw new ConflictException('Já existe um cliente com este e-mail')

    const client = await this.prisma.client.create({
      data: { ...dto, organizationId },
    })

    await this.audit.log({
      organizationId,
      userId,
      action: 'client.created',
      entity: 'client',
      entityId: client.id,
      after: client,
    })

    return client
  }

  async update(organizationId: string, userId: string, id: string, dto: UpdateClientDto) {
    const client = await this.findOne(organizationId, id)

    if (dto.email && dto.email !== client.email) {
      const exists = await this.prisma.client.findUnique({
        where: { organizationId_email: { organizationId, email: dto.email } },
      })
      if (exists) throw new ConflictException('Já existe um cliente com este e-mail')
    }

    const updated = await this.prisma.client.update({
      where: { id },
      data: dto,
    })

    await this.audit.log({
      organizationId,
      userId,
      action: 'client.updated',
      entity: 'client',
      entityId: id,
      before: client,
      after: updated,
    })

    return updated
  }

  async remove(organizationId: string, userId: string, id: string) {
    const client = await this.findOne(organizationId, id)

    await this.prisma.client.delete({ where: { id } })

    await this.audit.log({
      organizationId,
      userId,
      action: 'client.deleted',
      entity: 'client',
      entityId: id,
      before: client,
      severity: 'WARNING',
    })
  }

  // ─── Contacts ──────────────────────────────────────────────────────────────

  async addContact(organizationId: string, clientId: string, dto: CreateContactDto) {
    await this.findOne(organizationId, clientId)

    if (dto.isPrimary) {
      await this.prisma.clientContact.updateMany({
        where: { clientId },
        data: { isPrimary: false },
      })
    }

    return this.prisma.clientContact.create({ data: { ...dto, clientId } })
  }

  async updateContact(organizationId: string, clientId: string, contactId: string, dto: Partial<CreateContactDto>) {
    await this.findOne(organizationId, clientId)

    if (dto.isPrimary) {
      await this.prisma.clientContact.updateMany({
        where: { clientId, NOT: { id: contactId } },
        data: { isPrimary: false },
      })
    }

    return this.prisma.clientContact.update({
      where: { id: contactId },
      data: dto,
    })
  }

  async removeContact(organizationId: string, clientId: string, contactId: string) {
    await this.findOne(organizationId, clientId)
    await this.prisma.clientContact.delete({ where: { id: contactId } })
  }

  // ─── Notes ─────────────────────────────────────────────────────────────────

  async addNote(organizationId: string, clientId: string, userId: string, dto: CreateNoteDto) {
    await this.findOne(organizationId, clientId)

    return this.prisma.clientNote.create({
      data: { ...dto, clientId, userId, isInternal: dto.isInternal ?? true },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    })
  }

  async removeNote(organizationId: string, clientId: string, noteId: string) {
    await this.findOne(organizationId, clientId)
    await this.prisma.clientNote.delete({ where: { id: noteId } })
  }
}
