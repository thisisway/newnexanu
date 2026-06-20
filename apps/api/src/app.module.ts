import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import configuration from './config/configuration'
import { PrismaModule } from './modules/prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'
import { UsersModule } from './modules/users/users.module'
import { RolesModule } from './modules/roles/roles.module'
import { AuditModule } from './modules/audit/audit.module'
import { ClientsModule } from './modules/clients/clients.module'
import { ProductsModule } from './modules/products/products.module'
import { PlansModule } from './modules/plans/plans.module'
import { OrdersModule } from './modules/orders/orders.module'
import { InvoicesModule } from './modules/invoices/invoices.module'
import { PaymentsModule } from './modules/payments/payments.module'
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    RolesModule,
    AuditModule,
    ClientsModule,
    ProductsModule,
    PlansModule,
    OrdersModule,
    InvoicesModule,
    PaymentsModule,
    SubscriptionsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, _res: any, next: any) => {
        const orgId =
          req.headers['x-organization-id'] ||
          req.query.organizationId ||
          req.params.organizationId

        if (orgId) {
          req.organizationId = orgId
        }
        next()
      })
      .forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
