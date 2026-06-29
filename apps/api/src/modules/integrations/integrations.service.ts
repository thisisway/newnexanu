import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

const SECRET_PATTERNS = ['key', 'token', 'secret', 'password', 'pass']
const MASKED = '••••••••'

function isSecretField(name: string): boolean {
  const lower = name.toLowerCase()
  return SECRET_PATTERNS.some((p) => lower.includes(p))
}

function maskConfig(config: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(config)) {
    if (typeof v === 'string' && v && isSecretField(k)) {
      result[k] = MASKED
    } else {
      result[k] = v
    }
  }
  return result
}

function mergePreservingSecrets(
  incoming: Record<string, unknown>,
  existing: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...incoming }
  for (const [k, v] of Object.entries(incoming)) {
    if (typeof v === 'string' && v === MASKED && isSecretField(k)) {
      result[k] = existing[k] ?? ''
    }
  }
  return result
}

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async orgSettings(orgId: string): Promise<Record<string, unknown>> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { settings: true },
    })
    return (org?.settings as Record<string, unknown>) ?? {}
  }

  async findAll(orgId: string): Promise<Record<string, Record<string, unknown>>> {
    const settings = await this.orgSettings(orgId)
    const raw = (settings.integrations as Record<string, Record<string, unknown>>) ?? {}
    const masked: Record<string, Record<string, unknown>> = {}
    for (const [slug, cfg] of Object.entries(raw)) {
      masked[slug] = maskConfig(cfg)
    }
    return masked
  }

  async upsert(orgId: string, slug: string, incoming: Record<string, unknown>) {
    const settings = await this.orgSettings(orgId)
    const all = (settings.integrations as Record<string, Record<string, unknown>>) ?? {}
    const existing = all[slug] ?? {}
    const merged = mergePreservingSecrets(incoming, existing)

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        settings: JSON.parse(JSON.stringify({
          ...settings,
          integrations: { ...all, [slug]: merged },
        })) as Prisma.InputJsonValue,
      },
    })

    return maskConfig(merged)
  }

  async remove(orgId: string, slug: string) {
    const settings = await this.orgSettings(orgId)
    const all = (settings.integrations as Record<string, Record<string, unknown>>) ?? {}
    delete all[slug]

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        settings: JSON.parse(JSON.stringify({
          ...settings,
          integrations: all,
        })) as Prisma.InputJsonValue,
      },
    })

    return { ok: true }
  }
}
