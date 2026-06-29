import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common'
import { ApiKeysService } from './api-keys.service'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'

@Controller('admin/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @RequirePermissions('settings:read')
  findAll(@CurrentOrg() orgId: string) {
    return this.apiKeysService.findAll(orgId)
  }

  @Get('scopes')
  @RequirePermissions('settings:read')
  getScopes() {
    return this.apiKeysService.getScopes()
  }

  @Post()
  @RequirePermissions('settings:manage')
  create(
    @CurrentOrg() orgId: string,
    @Body() body: { name: string; scopes: string[]; expiresAt?: string },
  ) {
    return this.apiKeysService.create(orgId, body)
  }

  @Post(':id/revoke')
  @RequirePermissions('settings:manage')
  revoke(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.apiKeysService.revoke(orgId, id)
  }

  @Delete(':id')
  @RequirePermissions('settings:manage')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.apiKeysService.remove(orgId, id)
  }
}
