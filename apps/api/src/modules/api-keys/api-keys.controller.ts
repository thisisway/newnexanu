import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common'
import { ApiKeysService } from './api-keys.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('admin/api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  findAll(@Req() req: { user: { organizationId: string } }) {
    return this.apiKeysService.findAll(req.user.organizationId)
  }

  @Get('scopes')
  getScopes() {
    return this.apiKeysService.getScopes()
  }

  @Post()
  create(
    @Req() req: { user: { organizationId: string } },
    @Body() body: { name: string; scopes: string[]; expiresAt?: string },
  ) {
    return this.apiKeysService.create(req.user.organizationId, body)
  }

  @Post(':id/revoke')
  revoke(@Req() req: { user: { organizationId: string } }, @Param('id') id: string) {
    return this.apiKeysService.revoke(req.user.organizationId, id)
  }

  @Delete(':id')
  remove(@Req() req: { user: { organizationId: string } }, @Param('id') id: string) {
    return this.apiKeysService.remove(req.user.organizationId, id)
  }
}
