import { IsEnum, IsString } from 'class-validator'
import { PaymentMethod } from '@prisma/client'

export class CreatePaymentDto {
  @IsString() invoiceId: string
  @IsEnum(PaymentMethod) method: PaymentMethod
}
