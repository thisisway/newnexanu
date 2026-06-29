import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common'
import { ClientsService } from './clients.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { CreateContactDto } from './dto/create-contact.dto'
import { CreateNoteDto } from './dto/create-note.dto'
import { ListClientsDto } from './dto/list-clients.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'

@Controller('admin/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @RequirePermissions('clients:read')
  findAll(@CurrentOrg() orgId: string, @Query() query: ListClientsDto) {
    return this.clientsService.findAll(orgId, query)
  }

  @Get(':id')
  @RequirePermissions('clients:read')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.clientsService.findOne(orgId, id)
  }

  @Post()
  @RequirePermissions('clients:create')
  create(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.create(orgId, user.sub, dto)
  }

  @Patch(':id')
  @RequirePermissions('clients:update')
  update(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(orgId, user.sub, id, dto)
  }

  @Delete(':id')
  @RequirePermissions('clients:delete')
  remove(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.clientsService.remove(orgId, user.sub, id)
  }

  @Post(':id/portal-access')
  @RequirePermissions('clients:update')
  enablePortalAccess(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: any,
    @Param('id') clientId: string,
  ) {
    return this.clientsService.enablePortalAccess(orgId, clientId, user.sub)
  }

  // ─── Contacts ──────────────────────────────────────────────────────────────

  @Post(':id/contacts')
  @RequirePermissions('clients:update')
  addContact(
    @CurrentOrg() orgId: string,
    @Param('id') clientId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.clientsService.addContact(orgId, clientId, dto)
  }

  @Patch(':id/contacts/:contactId')
  @RequirePermissions('clients:update')
  updateContact(
    @CurrentOrg() orgId: string,
    @Param('id') clientId: string,
    @Param('contactId') contactId: string,
    @Body() dto: Partial<CreateContactDto>,
  ) {
    return this.clientsService.updateContact(orgId, clientId, contactId, dto)
  }

  @Delete(':id/contacts/:contactId')
  @RequirePermissions('clients:update')
  removeContact(
    @CurrentOrg() orgId: string,
    @Param('id') clientId: string,
    @Param('contactId') contactId: string,
  ) {
    return this.clientsService.removeContact(orgId, clientId, contactId)
  }

  // ─── Notes ─────────────────────────────────────────────────────────────────

  @Post(':id/notes')
  @RequirePermissions('clients:update')
  addNote(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: any,
    @Param('id') clientId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.clientsService.addNote(orgId, clientId, user.sub, dto)
  }

  @Delete(':id/notes/:noteId')
  @RequirePermissions('clients:update')
  removeNote(
    @CurrentOrg() orgId: string,
    @Param('id') clientId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.clientsService.removeNote(orgId, clientId, noteId)
  }
}
