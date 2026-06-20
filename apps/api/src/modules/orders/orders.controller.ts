import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'

@Controller('admin/orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  create(@CurrentOrg() orgId: string, @Body() dto: CreateOrderDto) {
    return this.service.create(orgId, dto)
  }

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

  @Patch(':id')
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.service.update(orgId, id, dto)
  }

  @Post(':id/activate')
  activate(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.activate(orgId, id)
  }

  @Post(':id/cancel')
  cancel(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.cancel(orgId, id)
  }
}
