import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import * as speakeasy from 'speakeasy'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { MailService } from '../mail/mail.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { JwtPayload } from '../../common/decorators/current-user.decorator'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private audit: AuditService,
    private mail: MailService,
  ) {}

  async register(dto: RegisterDto, ip?: string, userAgent?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })
    if (existingUser) {
      throw new ConflictException('Já existe uma conta com este e-mail.')
    }

    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug: dto.organizationSlug },
    })
    if (existingOrg) {
      throw new ConflictException(
        'Este identificador de organização já está em uso. Escolha outro.',
      )
    }

    const rounds = this.config.get<number>('bcrypt.rounds') ?? 12
    const passwordHash = await bcrypt.hash(dto.password, rounds)

    const ownerRole = await this.prisma.role.findFirst({
      where: { slug: 'owner', isSystem: true, organizationId: null },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    })

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          passwordHash,
          emailVerifiedAt: new Date(),
        },
      })

      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug: dto.organizationSlug,
        },
      })

      await tx.organizationUser.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          roleId: ownerRole?.id,
          status: 'ACTIVE',
        },
      })

      return { user, org }
    })

    const permissions = ownerRole?.permissions.map((rp) => rp.permission.action) ?? []

    await this.audit.log({
      userId: result.user.id,
      organizationId: result.org.id,
      action: 'auth.register',
      entity: 'User',
      entityId: result.user.id,
      after: { email: result.user.email, organizationSlug: result.org.slug },
      ip,
      userAgent,
    })

    return this.issueTokens(result.user, [
      {
        id: result.org.id,
        slug: result.org.slug,
        roleSlug: 'owner',
        permissions,
      },
    ])
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.')
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Sua conta está suspensa ou inativa.')
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('E-mail ou senha incorretos.')
    }

    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        throw new BadRequestException('Código de autenticação de dois fatores obrigatório.')
      }

      const isValidOtp = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: dto.twoFactorCode,
        window: 1,
      })

      if (!isValidOtp) {
        throw new UnauthorizedException('Código 2FA inválido.')
      }
    }

    const memberships = await this.prisma.organizationUser.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      include: {
        organization: true,
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    })

    const organizations = memberships.map((m) => ({
      id: m.organization.id,
      slug: m.organization.slug,
      roleSlug: m.role?.slug ?? 'viewer',
      permissions: m.role?.permissions.map((rp) => rp.permission.action) ?? [],
    }))

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    })

    await this.audit.log({
      userId: user.id,
      action: 'auth.login',
      entity: 'User',
      entityId: user.id,
      metadata: { organizations: organizations.map((o) => o.slug) },
      ip,
      userAgent,
    })

    return this.issueTokens(user, organizations)
  }

  async refreshTokens(refreshToken: string, ip?: string) {
    let payload: { sub: string }

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      })
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.')
    }

    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    })

    if (!session || session.userId !== payload.sub || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Sessão inválida. Faça login novamente.')
    }

    const memberships = await this.prisma.organizationUser.findMany({
      where: { userId: session.userId, status: 'ACTIVE' },
      include: {
        organization: true,
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    })

    const organizations = memberships.map((m) => ({
      id: m.organization.id,
      slug: m.organization.slug,
      roleSlug: m.role?.slug ?? 'viewer',
      permissions: m.role?.permissions.map((rp) => rp.permission.action) ?? [],
    }))

    await this.prisma.session.delete({ where: { id: session.id } })

    return this.issueTokens(session.user, organizations)
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.session.deleteMany({
      where: { userId, refreshToken },
    })
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })
    // Always return the same message to prevent user enumeration
    if (!user) return

    const token = await this.jwtService.signAsync(
      { sub: user.id, type: 'password_reset', email: user.email },
      {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: '1h',
      },
    )

    const resetUrl = `${this.config.get('frontendUrl') ?? 'http://localhost:3000'}/reset-password?token=${token}`
    await this.mail.sendPasswordReset(user.email, resetUrl)
    console.log(`[Password Reset] ${user.email} → ${resetUrl}`)
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: { sub: string; type: string }
    try {
      payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('jwt.secret'),
      })
    } catch {
      throw new BadRequestException('Token de redefinição inválido ou expirado.')
    }

    if (payload.type !== 'password_reset') {
      throw new BadRequestException('Token inválido.')
    }

    const rounds = this.config.get<number>('bcrypt.rounds') ?? 12
    const passwordHash = await bcrypt.hash(newPassword, rounds)

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash },
    })

    // Invalidate all sessions so the user must log in with the new password
    await this.prisma.session.deleteMany({ where: { userId: payload.sub } })
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        phone: true,
        twoFactorEnabled: true,
        emailVerifiedAt: true,
        createdAt: true,
        organizations: {
          where: { status: 'ACTIVE' },
          include: {
            organization: true,
            role: true,
          },
        },
      },
    })
    return user
  }

  private async issueTokens(
    user: { id: string; email: string; name: string },
    organizations: Array<{
      id: string
      slug: string
      roleSlug: string
      permissions: string[]
    }>,
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      organizations,
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(
        { sub: user.id },
        {
          secret: this.config.get<string>('jwt.refreshSecret'),
          expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
        },
      ),
    ])

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizations,
      },
    }
  }
}
