import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditSeverity } from '@prisma/client'

export interface CreateAuditLogDto {
  organizationId?: string
  userId?: string
  action: string
  entity?: string
  entityId?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ip?: string
  userAgent?: string
  severity?: AuditSeverity
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: dto.organizationId,
        userId: dto.userId,
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId,
        before: dto.before ?? undefined,
        after: dto.after ?? undefined,
        metadata: dto.metadata ?? undefined,
        ip: dto.ip,
        userAgent: dto.userAgent,
        severity: dto.severity ?? 'INFO',
      },
    })
  }

  async findByOrganization(
    organizationId: string,
    options: {
      page?: number
      perPage?: number
      entity?: string
      userId?: string
      action?: string
    } = {},
  ) {
    const page = options.page ?? 1
    const perPage = options.perPage ?? 50
    const skip = (page - 1) * perPage

    const where: Record<string, unknown> = { organizationId }
    if (options.entity) where.entity = options.entity
    if (options.userId) where.userId = options.userId
    if (options.action) where.action = { contains: options.action }

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      }),
    ])

    return {
      data: items,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    }
  }
}
