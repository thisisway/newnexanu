import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'

@Controller('admin/payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  create(@CurrentOrg() orgId: string, @Body() dto: CreatePaymentDto) {
    return this.service.create(orgId, dto)
  }

  @Get()
  findAll(
    @CurrentOrg() orgId: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(orgId, {
      invoiceId,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    })
  }

  @Get(':id')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id)
  }

  @Post(':id/confirm')
  confirm(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.confirm(orgId, id)
  }
}
