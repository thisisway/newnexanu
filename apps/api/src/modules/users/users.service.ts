import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { InviteUserDto } from './dto/invite-user.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private audit: AuditService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.organizationUser.findMany({
      where: { organizationId, status: 'ACTIVE' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        role: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })
  }

  async findOne(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationUser.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            phone: true,
            twoFactorEnabled: true,
            status: true,
            lastLoginAt: true,
            lastLoginIp: true,
            emailVerifiedAt: true,
            createdAt: true,
          },
        },
        role: true,
      },
    })

    if (!membership) throw new NotFoundException('Usuário não encontrado nesta organização.')

    return membership
  }

  async updateProfile(userId: string, dto: UpdateUserDto, requestUserId: string) {
    if (userId !== requestUserId) {
      throw new ForbiddenException('Você não pode editar o perfil de outro usuário.')
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('Usuário não encontrado.')

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, name: true, email: true, avatarUrl: true, phone: true },
    })

    await this.audit.log({
      userId: requestUserId,
      action: 'user.profile_updated',
      entity: 'User',
      entityId: userId,
      before: { name: user.name, phone: user.phone },
      after: { name: updated.name, phone: updated.phone },
    })

    return updated
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('Usuário não encontrado.')

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash)
    if (!isValid) {
      throw new BadRequestException('Senha atual incorreta.')
    }

    const rounds = this.config.get<number>('bcrypt.rounds') ?? 12
    const passwordHash = await bcrypt.hash(dto.newPassword, rounds)

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    await this.prisma.session.deleteMany({ where: { userId } })

    await this.audit.log({
      userId,
      action: 'user.password_changed',
      entity: 'User',
      entityId: userId,
      severity: 'WARNING',
    })

    return { message: 'Senha alterada com sucesso. Faça login novamente.' }
  }

  async invite(organizationId: string, dto: InviteUserDto, invitedByUserId: string) {
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })

    const existingMembership = user
      ? await this.prisma.organizationUser.findUnique({
          where: {
            organizationId_userId: { organizationId, userId: user.id },
          },
        })
      : null

    if (existingMembership) {
      throw new BadRequestException('Este usuário já é membro desta organização.')
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          name: dto.name || dto.email,
          passwordHash: '',
          status: 'ACTIVE',
        },
      })
    }

    await this.prisma.organizationUser.create({
      data: {
        organizationId,
        userId: user.id,
        roleId: dto.roleId,
        status: 'INVITED',
        invitedByUserId,
      },
    })

    await this.audit.log({
      userId: invitedByUserId,
      organizationId,
      action: 'user.invited',
      entity: 'User',
      entityId: user.id,
      after: { email: user.email, roleId: dto.roleId },
    })

    return {
      message: `Convite enviado para ${dto.email}.`,
      user: { id: user.id, email: user.email },
    }
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
    roleId: string,
    requestUserId: string,
  ) {
    const membership = await this.prisma.organizationUser.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      include: { role: true },
    })

    if (!membership) throw new NotFoundException('Membro não encontrado.')

    if (membership.role?.slug === 'owner') {
      throw new ForbiddenException('Não é possível alterar o papel do proprietário.')
    }

    const updated = await this.prisma.organizationUser.update({
      where: { organizationId_userId: { organizationId, userId } },
      data: { roleId },
      include: { role: true },
    })

    await this.audit.log({
      userId: requestUserId,
      organizationId,
      action: 'user.role_changed',
      entity: 'OrganizationUser',
      entityId: userId,
      before: { roleId: membership.roleId },
      after: { roleId },
      severity: 'WARNING',
    })

    return updated
  }

  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        ip: true,
        userAgent: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async revokeSession(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } })
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Sessão não encontrada.')
    }

    await this.prisma.session.delete({ where: { id: sessionId } })

    await this.audit.log({
      userId,
      action: 'user.session_revoked',
      entity: 'Session',
      entityId: sessionId,
    })
  }
}
