import { Controller, Get } from '@nestjs/common'
import { StatsService } from './stats.service'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'

@Controller('admin/stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get('dashboard')
  getDashboard(@CurrentOrg() orgId: string) {
    return this.service.getDashboard(orgId)
  }
}
