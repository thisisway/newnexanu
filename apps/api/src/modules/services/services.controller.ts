import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common'
import { IsString, IsOptional } from 'class-validator'
import { ServicesService } from './services.service'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'

class UpdateNotesDto {
  @IsString()
  @IsOptional()
  notes: string
}

@Controller('admin/services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Get('stats')
  stats(@CurrentOrg() orgId: string) {
    return this.service.stats(orgId)
  }

  @Get()
  findAll(
    @CurrentOrg() orgId: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(orgId, {
      status,
      clientId,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    })
  }

  @Get(':id')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id)
  }

  @Post(':id/suspend')
  suspend(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.suspend(orgId, id)
  }

  @Post(':id/reactivate')
  reactivate(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.reactivate(orgId, id)
  }

  @Post(':id/cancel')
  cancel(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.cancel(orgId, id)
  }

  @Patch(':id/notes')
  updateNotes(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateNotesDto,
  ) {
    return this.service.updateNotes(orgId, id, dto.notes)
  }
}
