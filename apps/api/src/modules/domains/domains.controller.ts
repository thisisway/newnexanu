import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common'
import { DomainsService } from './domains.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

type DomainStatus = 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON' | 'PENDING_TRANSFER' | 'SUSPENDED'

@Controller('admin/domains')
@UseGuards(JwtAuthGuard)
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Get()
  findAll(
    @Req() req: { user: { organizationId: string } },
    @Query('search') search?: string,
    @Query('status') status?: DomainStatus,
    @Query('clientId') clientId?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.domainsService.findAll(req.user.organizationId, {
      search,
      status,
      clientId,
      page: page ? parseInt(page) : undefined,
      perPage: perPage ? parseInt(perPage) : undefined,
    })
  }

  @Get('stats')
  getStats(@Req() req: { user: { organizationId: string } }) {
    return this.domainsService.getStats(req.user.organizationId)
  }

  @Get(':id')
  findOne(@Req() req: { user: { organizationId: string } }, @Param('id') id: string) {
    return this.domainsService.findOne(req.user.organizationId, id)
  }

  @Post()
  create(
    @Req() req: { user: { organizationId: string } },
    @Body() body: {
      name: string
      clientId?: string
      registrar?: string
      expiresAt?: string
      autoRenew?: boolean
      notes?: string
    },
  ) {
    return this.domainsService.create(req.user.organizationId, body)
  }

  @Put(':id')
  update(
    @Req() req: { user: { organizationId: string } },
    @Param('id') id: string,
    @Body() body: {
      clientId?: string | null
      registrar?: string
      expiresAt?: string | null
      autoRenew?: boolean
      status?: DomainStatus
      notes?: string
    },
  ) {
    return this.domainsService.update(req.user.organizationId, id, body)
  }

  @Delete(':id')
  remove(@Req() req: { user: { organizationId: string } }, @Param('id') id: string) {
    return this.domainsService.remove(req.user.organizationId, id)
  }
}
