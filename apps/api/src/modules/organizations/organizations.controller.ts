import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { OrganizationsService } from './organizations.service'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { UpdateOrganizationDto } from './dto/update-organization.dto'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'

@Controller('admin/organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: JwtPayload) {
    return this.organizationsService.create(dto, user.sub)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.organizationsService.findById(id, user.sub)
  }

  @Patch(':id')
  @RequirePermissions('organization:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
  ) {
    return this.organizationsService.update(id, dto, user.sub, orgId)
  }

  @Get(':id/members')
  @RequirePermissions('team:read')
  getMembers(@Param('id') id: string) {
    return this.organizationsService.getMembers(id)
  }

  @Delete(':organizationId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('team:manage')
  removeMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationsService.removeMember(organizationId, userId, user.sub)
  }
}
