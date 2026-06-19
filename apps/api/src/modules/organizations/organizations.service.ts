import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { UpdateOrganizationDto } from './dto/update-organization.dto'

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateOrganizationDto, userId: string) {
    const existing = await this.prisma.organization.findUnique({
      where: { slug: dto.slug },
    })
    if (existing) {
      throw new ConflictException(
        'Este identificador já está em uso. Escolha outro.',
      )
    }

    const ownerRole = await this.prisma.role.findFirst({
      where: { slug: 'owner', isSystem: true, organizationId: null },
    })

    const org = await this.prisma.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          domain: dto.domain,
        },
      })

      await tx.organizationUser.create({
        data: {
          organizationId: created.id,
          userId,
          roleId: ownerRole?.id,
          status: 'ACTIVE',
        },
      })

      return created
    })

    await this.audit.log({
      userId,
      organizationId: org.id,
      action: 'organization.created',
      entity: 'Organization',
      entityId: org.id,
      after: { name: org.name, slug: org.slug },
    })

    return org
  }

  async findById(id: string, requestUserId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          where: { status: 'ACTIVE' },
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            role: true,
          },
        },
      },
    })

    if (!org) throw new NotFoundException('Organização não encontrada.')

    const isMember = org.users.some((u) => u.userId === requestUserId)
    if (!isMember) throw new ForbiddenException('Você não tem acesso a esta organização.')

    return org
  }

  async update(id: string, dto: UpdateOrganizationDto, userId: string, orgId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } })
    if (!org) throw new NotFoundException('Organização não encontrada.')

    if (dto.slug && dto.slug !== org.slug) {
      const exists = await this.prisma.organization.findUnique({
        where: { slug: dto.slug },
      })
      if (exists) throw new ConflictException('Este slug já está em uso.')
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: dto,
    })

    await this.audit.log({
      userId,
      organizationId: orgId,
      action: 'organization.updated',
      entity: 'Organization',
      entityId: id,
      before: { name: org.name, slug: org.slug },
      after: { name: updated.name, slug: updated.slug },
    })

    return updated
  }

  async getMembers(organizationId: string) {
    return this.prisma.organizationUser.findMany({
      where: { organizationId, status: 'ACTIVE' },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        role: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })
  }

  async removeMember(organizationId: string, userId: string, requestUserId: string) {
    if (userId === requestUserId) {
      throw new ForbiddenException('Você não pode remover a si mesmo da organização.')
    }

    const member = await this.prisma.organizationUser.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      include: { role: true },
    })

    if (!member) throw new NotFoundException('Membro não encontrado.')
    if (member.role?.slug === 'owner') {
      throw new ForbiddenException('Não é possível remover o proprietário da organização.')
    }

    await this.prisma.organizationUser.delete({
      where: { organizationId_userId: { organizationId, userId } },
    })

    await this.audit.log({
      userId: requestUserId,
      organizationId,
      action: 'organization.member_removed',
      entity: 'OrganizationUser',
      entityId: userId,
      severity: 'WARNING',
    })
  }
}
