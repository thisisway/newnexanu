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
import { RolesService } from './roles.service'
import { CreateRoleDto } from './dto/create-role.dto'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'

@Controller('admin/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles:read')
  findAll(@CurrentOrg() orgId: string) {
    return this.rolesService.findAll(orgId)
  }

  @Get('permissions')
  @RequirePermissions('roles:read')
  findAllPermissions() {
    return this.rolesService.findAllPermissions()
  }

  @Post()
  @RequirePermissions('roles:manage')
  create(
    @Body() dto: CreateRoleDto,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.create(orgId, dto, user.sub)
  }

  @Patch(':id')
  @RequirePermissions('roles:manage')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateRoleDto>,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.update(id, orgId, dto, user.sub)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('roles:manage')
  delete(@Param('id') id: string, @CurrentOrg() orgId: string, @CurrentUser() user: JwtPayload) {
    return this.rolesService.delete(id, orgId, user.sub)
  }
}
