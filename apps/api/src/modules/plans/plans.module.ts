import { Module } from '@nestjs/common'
import { PlansService } from './plans.service'
import { PlansController, AddonsController } from './plans.controller'
import { AuditModule } from '../audit/audit.module'

@Module({
  imports: [AuditModule],
  controllers: [PlansController, AddonsController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
