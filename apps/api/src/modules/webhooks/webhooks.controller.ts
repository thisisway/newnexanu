import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common'
import { WebhooksService } from './webhooks.service'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'

@Controller('admin/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @RequirePermissions('settings:read')
  findAll(@CurrentOrg() orgId: string) {
    return this.webhooksService.findAll(orgId)
  }

  @Get(':id')
  @RequirePermissions('settings:read')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.webhooksService.findOne(orgId, id)
  }

  @Post()
  @RequirePermissions('settings:manage')
  create(
    @CurrentOrg() orgId: string,
    @Body() body: { name: string; url: string; secret?: string; events: string[] },
  ) {
    return this.webhooksService.create(orgId, body)
  }

  @Put(':id')
  @RequirePermissions('settings:manage')
  update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: { name?: string; url?: string; secret?: string; events?: string[]; status?: 'ACTIVE' | 'INACTIVE' },
  ) {
    return this.webhooksService.update(orgId, id, body)
  }

  @Delete(':id')
  @RequirePermissions('settings:manage')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.webhooksService.remove(orgId, id)
  }

  @Post(':id/test')
  @RequirePermissions('settings:manage')
  test(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.webhooksService.test(orgId, id)
  }
}
