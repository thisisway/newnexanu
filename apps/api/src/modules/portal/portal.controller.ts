import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common'
import { PortalService } from './portal.service'
import { TicketsService } from '../tickets/tickets.service'
import { PaymentsService } from '../payments/payments.service'
import { CreateTicketDto } from '../tickets/dto/create-ticket.dto'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'

@Controller('portal')
export class PortalController {
  constructor(
    private readonly service: PortalService,
    private readonly ticketsService: TicketsService,
    private readonly paymentsService: PaymentsService,
  ) {}

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

  // ── Tickets ──────────────────────────────────────────────────────────────

  @Get('tickets')
  async getTickets(@CurrentUser() user: JwtPayload, @CurrentOrg() orgId: string) {
    const client = await this.service.getProfile(user.sub, orgId)
    return this.ticketsService.findByClient(orgId, client.id)
  }

  @Post('tickets')
  async createTicket(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Body() dto: CreateTicketDto,
  ) {
    const client = await this.service.getProfile(user.sub, orgId)
    return this.ticketsService.createByClient(orgId, client.id, dto)
  }

  @Get('tickets/:id')
  async getTicket(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    const client = await this.service.getProfile(user.sub, orgId)
    return this.ticketsService.findOneByClient(orgId, id, client.id)
  }

  @Post('tickets/:id/messages')
  async addMessage(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body('body') body: string,
  ) {
    const client = await this.service.getProfile(user.sub, orgId)
    return this.ticketsService.addClientMessage(orgId, id, client.id, body)
  }

  @Patch('tickets/:id/close')
  async closeTicket(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    const client = await this.service.getProfile(user.sub, orgId)
    return this.ticketsService.closeByClient(orgId, id, client.id)
  }

  @Get('domains')
  getDomains(@CurrentUser() user: JwtPayload, @CurrentOrg() orgId: string) {
    return this.service.getDomains(user.sub, orgId)
  }

  // ── Payments ─────────────────────────────────────────────────────────────

  @Post('payments')
  async createPayment(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Body('invoiceId') invoiceId: string,
    @Body('method') method: string,
  ) {
    await this.service.assertInvoiceOwner(user.sub, orgId, invoiceId)
    return this.paymentsService.create(orgId, { invoiceId, method: method as any })
  }
}
