import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common'
import { WebhooksService } from './webhooks.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('admin/webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  findAll(@Req() req: { user: { organizationId: string } }) {
    return this.webhooksService.findAll(req.user.organizationId)
  }

  @Get(':id')
  findOne(@Req() req: { user: { organizationId: string } }, @Param('id') id: string) {
    return this.webhooksService.findOne(req.user.organizationId, id)
  }

  @Post()
  create(
    @Req() req: { user: { organizationId: string } },
    @Body() body: { name: string; url: string; secret?: string; events: string[] },
  ) {
    return this.webhooksService.create(req.user.organizationId, body)
  }

  @Put(':id')
  update(
    @Req() req: { user: { organizationId: string } },
    @Param('id') id: string,
    @Body() body: { name?: string; url?: string; secret?: string; events?: string[]; status?: 'ACTIVE' | 'INACTIVE' },
  ) {
    return this.webhooksService.update(req.user.organizationId, id, body)
  }

  @Delete(':id')
  remove(@Req() req: { user: { organizationId: string } }, @Param('id') id: string) {
    return this.webhooksService.remove(req.user.organizationId, id)
  }

  @Post(':id/test')
  test(@Req() req: { user: { organizationId: string } }, @Param('id') id: string) {
    return this.webhooksService.test(req.user.organizationId, id)
  }
}
