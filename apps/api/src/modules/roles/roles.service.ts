import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { CreateRoleDto } from './dto/create-role.dto'

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(organizationId: string) {
    const [systemRoles, orgRoles] = await Promise.all([
      this.prisma.role.findMany({
        where: { isSystem: true, organizationId: null },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      }),
      this.prisma.role.findMany({
        where: { organizationId },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      }),
    ])

    return { systemRoles, customRoles: orgRoles }
  }

  async create(organizationId: string, dto: CreateRoleDto, userId: string) {
    const existing = await this.prisma.role.findUnique({
      where: { organizationId_slug: { organizationId, slug: dto.slug } },
    })
    if (existing) {
      throw new ConflictException('Já existe um papel com este identificador.')
    }

    const role = await this.prisma.role.create({
      data: {
        organizationId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        isSystem: false,
        permissions: dto.permissions?.length
          ? {
              create: dto.permissions.map((action) => ({
                permission: {
                  connectOrCreate: {
                    where: { action },
                    create: { action, module: action.split(':')[0] },
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        permissions: { include: { permission: true } },
      },
    })

    await this.audit.log({
      userId,
      organizationId,
      action: 'role.created',
      entity: 'Role',
      entityId: role.id,
      after: { name: role.name, permissions: dto.permissions },
    })

    return role
  }

  async update(
    roleId: string,
    organizationId: string,
    dto: Partial<CreateRoleDto>,
    userId: string,
  ) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } })
    if (!role) throw new NotFoundException('Papel não encontrado.')
    if (role.isSystem) throw new ForbiddenException('Papéis do sistema não podem ser editados.')
    if (role.organizationId !== organizationId) throw new ForbiddenException('Acesso negado.')

    if (dto.permissions !== undefined) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId } })

      if (dto.permissions.length > 0) {
        for (const action of dto.permissions) {
          const perm = await this.prisma.permission.upsert({
            where: { action },
            create: { action, module: action.split(':')[0] },
            update: {},
          })
          await this.prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId, permissionId: perm.id } },
            create: { roleId, permissionId: perm.id },
            update: {},
          })
        }
      }
    }

    const updated = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: {
        permissions: { include: { permission: true } },
      },
    })

    await this.audit.log({
      userId,
      organizationId,
      action: 'role.updated',
      entity: 'Role',
      entityId: roleId,
      after: { name: dto.name, permissions: dto.permissions },
    })

    return updated
  }

  async delete(roleId: string, organizationId: string, userId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { members: true },
    })

    if (!role) throw new NotFoundException('Papel não encontrado.')
    if (role.isSystem) throw new ForbiddenException('Papéis do sistema não podem ser excluídos.')
    if (role.organizationId !== organizationId) throw new ForbiddenException('Acesso negado.')
    if (role.members.length > 0) {
      throw new ForbiddenException(
        'Este papel está em uso por um ou mais membros. Reatribua-os antes de excluir.',
      )
    }

    await this.prisma.role.delete({ where: { id: roleId } })

    await this.audit.log({
      userId,
      organizationId,
      action: 'role.deleted',
      entity: 'Role',
      entityId: roleId,
      severity: 'WARNING',
      before: { name: role.name },
    })
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    })
  }
}
