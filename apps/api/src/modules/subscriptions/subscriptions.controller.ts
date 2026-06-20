import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common'
import { SubscriptionsService } from './subscriptions.service'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'

@Controller('admin/subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get()
  findAll(
    @CurrentOrg() orgId: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(orgId, {
      clientId,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    })
  }

  @Get(':id')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id)
  }

  @Post(':id/cancel')
  cancel(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body('atPeriodEnd') atPeriodEnd?: boolean,
  ) {
    return this.service.cancel(orgId, id, atPeriodEnd ?? false)
  }

  @Post(':id/suspend')
  suspend(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.suspend(orgId, id)
  }

  @Post(':id/reactivate')
  reactivate(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.reactivate(orgId, id)
  }
}
