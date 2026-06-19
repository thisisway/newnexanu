import { Module } from '@nestjs/common'
import { ProductsService } from './products.service'
import { ProductsController, StoreController } from './products.controller'
import { AuditModule } from '../audit/audit.module'

@Module({
  imports: [AuditModule],
  controllers: [ProductsController, StoreController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
