import { Controller, Get, Query } from '@nestjs/common'
import { PortalService } from './portal.service'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'

@Controller('portal')
export class PortalController {
  constructor(private readonly service: PortalService) {}

  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload, @CurrentOrg() orgId: string) {
    return this.service.getProfile(user.sub, orgId)
  }

  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtPayload, @CurrentOrg() orgId: string) {
    return this.service.getDashboard(user.sub, orgId)
  }

  @Get('invoices')
  getInvoices(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getInvoices(user.sub, orgId, {
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    })
  }

  @Get('orders')
  getOrders(@CurrentUser() user: JwtPayload, @CurrentOrg() orgId: string) {
    return this.service.getOrders(user.sub, orgId)
  }
}
