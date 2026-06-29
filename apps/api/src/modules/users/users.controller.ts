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
import { UsersService } from './users.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { InviteUserDto } from './dto/invite-user.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admin/team')
  @RequirePermissions('team:read')
  findAll(@CurrentOrg() orgId: string) {
    return this.usersService.findAll(orgId)
  }

  @Get('admin/team/:userId')
  @RequirePermissions('team:read')
  findOne(@Param('userId') userId: string, @CurrentOrg() orgId: string) {
    return this.usersService.findOne(userId, orgId)
  }

  @Post('admin/team/invite')
  @RequirePermissions('team:manage')
  invite(
    @Body() dto: InviteUserDto,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.invite(orgId, dto, user.sub)
  }

  @Patch('admin/team/:userId/role')
  @RequirePermissions('team:manage')
  updateRole(
    @Param('userId') userId: string,
    @Body('roleId') roleId: string,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.updateMemberRole(orgId, userId, roleId, user.sub)
  }

  @Get('account/profile')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfileById(user.sub)
  }

  @Patch('account/profile')
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.sub, dto, user.sub)
  }

  @Post('account/change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.sub, dto)
  }

  @Get('account/sessions')
  getSessions(@CurrentUser() user: JwtPayload) {
    return this.usersService.getSessions(user.sub)
  }

  @Delete('account/sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeSession(@Param('sessionId') sessionId: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.revokeSession(sessionId, user.sub)
  }
}
