import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common'
import { TicketsService } from './tickets.service'
import { CreateTicketDto } from './dto/create-ticket.dto'
import { UpdateTicketDto } from './dto/update-ticket.dto'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'

@Controller('admin/tickets')
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Get()
  findAll(
    @CurrentOrg() orgId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('clientId') clientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(orgId, {
      status, priority, clientId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    })
  }

  @Get(':id')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id)
  }

  @Post()
  create(@CurrentOrg() orgId: string, @CurrentUser() user: JwtPayload, @Body() dto: CreateTicketDto) {
    return this.service.createByAdmin(orgId, dto, user.sub)
  }

  @Patch(':id')
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.service.update(orgId, id, dto)
  }

  @Post(':id/messages')
  addMessage(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body('body') body: string,
    @Body('isInternal') isInternal?: boolean,
  ) {
    return this.service.addAdminMessage(orgId, id, user.sub, body, isInternal)
  }
}
