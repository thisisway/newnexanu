import { Controller, Get, Query } from '@nestjs/common'
import { AuditService } from './audit.service'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'

@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit:read')
  findAll(
    @CurrentOrg() orgId: string,
    @CurrentUser() _user: JwtPayload,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Query('entity') entity?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.findByOrganization(orgId, {
      page,
      perPage,
      entity,
      userId,
      action,
    })
  }
}
