import { Module } from '@nestjs/common'
import { PortalController } from './portal.controller'
import { PortalService } from './portal.service'
import { TicketsModule } from '../tickets/tickets.module'
import { PaymentsModule } from '../payments/payments.module'

@Module({
  imports: [TicketsModule, PaymentsModule],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
