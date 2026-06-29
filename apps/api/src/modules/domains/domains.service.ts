import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

type DomainStatus = 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON' | 'PENDING_TRANSFER' | 'SUSPENDED'

@Injectable()
export class DomainsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params: {
    search?: string
    status?: DomainStatus
    clientId?: string
    page?: number
    perPage?: number
  }) {
    const { search, status, clientId, page = 1, perPage = 20 } = params
    const skip = (page - 1) * perPage

    const where = {
      organizationId,
      ...(status && { status }),
      ...(clientId && { clientId }),
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    }

    const [data, total] = await Promise.all([
      this.prisma.domain.findMany({
        where,
        include: { client: { select: { id: true, name: true, email: true } } },
        orderBy: [{ expiresAt: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: perPage,
      }),
      this.prisma.domain.count({ where }),
    ])

    return { data, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } }
  }

  async findOne(organizationId: string, id: string) {
    const domain = await this.prisma.domain.findFirst({
      where: { id, organizationId },
      include: { client: { select: { id: true, name: true, email: true } } },
    })
    if (!domain) throw new NotFoundException('Domain not found')
    return domain
  }

  async create(organizationId: string, data: {
    name: string
    clientId?: string
    registrar?: string
    expiresAt?: string
    autoRenew?: boolean
    notes?: string
  }) {
    const existing = await this.prisma.domain.findUnique({
      where: { organizationId_name: { organizationId, name: data.name } },
    })
    if (existing) throw new ConflictException('Domain already registered')

    return this.prisma.domain.create({
      data: {
        organizationId,
        name: data.name.toLowerCase().trim(),
        clientId: data.clientId ?? null,
        registrar: data.registrar ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        autoRenew: data.autoRenew ?? true,
        notes: data.notes ?? null,
      },
      include: { client: { select: { id: true, name: true, email: true } } },
    })
  }

  async update(organizationId: string, id: string, data: {
    clientId?: string | null
    registrar?: string
    expiresAt?: string | null
    autoRenew?: boolean
    status?: DomainStatus
    notes?: string
  }) {
    await this.findOne(organizationId, id)
    return this.prisma.domain.update({
      where: { id },
      data: {
        ...data,
        expiresAt: data.expiresAt !== undefined
          ? (data.expiresAt ? new Date(data.expiresAt) : null)
          : undefined,
      },
      include: { client: { select: { id: true, name: true, email: true } } },
    })
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id)
    await this.prisma.domain.delete({ where: { id } })
  }

  async getStats(organizationId: string) {
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const [total, active, expired, expiringSoon] = await Promise.all([
      this.prisma.domain.count({ where: { organizationId } }),
      this.prisma.domain.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.domain.count({ where: { organizationId, status: 'EXPIRED' } }),
      this.prisma.domain.count({
        where: {
          organizationId,
          status: 'ACTIVE',
          expiresAt: { gte: now, lte: in30Days },
        },
      }),
    ])

    return { total, active, expired, expiringSoon }
  }
}
