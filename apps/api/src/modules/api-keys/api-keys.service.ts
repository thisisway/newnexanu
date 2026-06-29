import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { createHash, randomBytes } from 'crypto'

export const ALL_SCOPES = [
  'clients:read', 'clients:write',
  'orders:read', 'orders:write',
  'invoices:read', 'invoices:write',
  'payments:read',
  'products:read',
  'subscriptions:read',
  'tickets:read', 'tickets:write',
  'webhooks:read', 'webhooks:write',
]

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  private hash(key: string) {
    return createHash('sha256').update(key).digest('hex')
  }

  async findAll(organizationId: string) {
    return this.prisma.apiKey.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(organizationId: string, data: { name: string; scopes: string[]; expiresAt?: string }) {
    const raw = `nxk_${randomBytes(32).toString('hex')}`
    const keyHash = this.hash(raw)
    const keyPrefix = raw.slice(0, 12)

    const apiKey = await this.prisma.apiKey.create({
      data: {
        organizationId,
        name: data.name,
        scopes: data.scopes,
        keyHash,
        keyPrefix,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    })

    return { ...apiKey, rawKey: raw }
  }

  async revoke(organizationId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, organizationId } })
    if (!key) throw new NotFoundException('API key not found')
    return this.prisma.apiKey.update({ where: { id }, data: { status: 'REVOKED' } })
  }

  async remove(organizationId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, organizationId } })
    if (!key) throw new NotFoundException('API key not found')
    await this.prisma.apiKey.delete({ where: { id } })
  }

  getScopes() {
    return ALL_SCOPES
  }
}
