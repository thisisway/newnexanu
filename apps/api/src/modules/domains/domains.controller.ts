import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common'
import { DomainsService } from './domains.service'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'

type DomainStatus = 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON' | 'PENDING_TRANSFER' | 'SUSPENDED'

@Controller('admin/domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Get()
  @RequirePermissions('domains:read')
  findAll(
    @CurrentOrg() orgId: string,
    @Query('search') search?: string,
    @Query('status') status?: DomainStatus,
    @Query('clientId') clientId?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.domainsService.findAll(orgId, {
      search,
      status,
      clientId,
      page: page ? parseInt(page) : undefined,
      perPage: perPage ? parseInt(perPage) : undefined,
    })
  }

  @Get('stats')
  @RequirePermissions('domains:read')
  getStats(@CurrentOrg() orgId: string) {
    return this.domainsService.getStats(orgId)
  }

  @Get(':id')
  @RequirePermissions('domains:read')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.domainsService.findOne(orgId, id)
  }

  @Post()
  @RequirePermissions('domains:manage')
  create(
    @CurrentOrg() orgId: string,
    @Body() body: {
      name: string
      clientId?: string
      registrar?: string
      expiresAt?: string
      autoRenew?: boolean
      notes?: string
    },
  ) {
    return this.domainsService.create(orgId, body)
  }

  @Put(':id')
  @RequirePermissions('domains:manage')
  update(
    @CurrentOrg() orgId: string,
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
    return this.domainsService.update(orgId, id, body)
  }

  @Delete(':id')
  @RequirePermissions('domains:manage')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.domainsService.remove(orgId, id)
  }
}
