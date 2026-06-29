import { Controller, Get, Put, Delete, Param, Body } from '@nestjs/common'
import { IntegrationsService } from './integrations.service'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'

@Controller('admin/integrations')
export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  @Get()
  findAll(@CurrentOrg() orgId: string) {
    return this.service.findAll(orgId)
  }

  @Put(':slug')
  upsert(
    @CurrentOrg() orgId: string,
    @Param('slug') slug: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.upsert(orgId, slug, body)
  }

  @Delete(':slug')
  remove(@CurrentOrg() orgId: string, @Param('slug') slug: string) {
    return this.service.remove(orgId, slug)
  }
}
