import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'
import { JwtPayload } from '../decorators/current-user.decorator'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredPermissions || requiredPermissions.length === 0) return true

    const request = context.switchToHttp().getRequest()
    const user: JwtPayload = request.user
    const organizationId: string = request.organizationId

    if (!user || !organizationId) {
      throw new ForbiddenException('Acesso negado.')
    }

    const orgMembership = user.organizations.find((org) => org.id === organizationId)

    if (!orgMembership) {
      throw new ForbiddenException('Você não tem acesso a esta organização.')
    }

    const hasPermission = requiredPermissions.every((perm) =>
      orgMembership.permissions.includes(perm),
    )

    if (!hasPermission) {
      throw new ForbiddenException('Você não tem permissão para realizar esta ação.')
    }

    return true
  }
}
