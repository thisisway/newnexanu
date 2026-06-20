import { Module } from '@nestjs/common'
import { PortalController } from './portal.controller'
import { PortalService } from './portal.service'
import { TicketsModule } from '../tickets/tickets.module'

@Module({
  imports: [TicketsModule],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
