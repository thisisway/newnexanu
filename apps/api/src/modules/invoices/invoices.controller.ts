import { Controller, Get, Post, Param, Query } from '@nestjs/common'
import { InvoicesService } from './invoices.service'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'

@Controller('admin/invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

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

  @Get('overdue')
  getOverdue(@CurrentOrg() orgId: string) {
    return this.service.getOverdue(orgId)
  }

  @Get(':id')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id)
  }

  @Post(':id/mark-paid')
  markPaid(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.markPaid(orgId, id)
  }

  @Post(':id/cancel')
  cancel(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.cancel(orgId, id)
  }
}
