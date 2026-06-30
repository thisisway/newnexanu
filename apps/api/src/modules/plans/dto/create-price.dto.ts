import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { BillingCycle } from '@prisma/client'

export class CreatePriceDto {
  @IsEnum(BillingCycle) cycle: BillingCycle
  @IsString() amount: string
  @IsOptional() @IsString() setupFee?: string
  @IsOptional() @IsInt() @Min(0) trialDays?: number
  @IsOptional() @IsBoolean() isDefault?: boolean
  @IsOptional() @IsString() currency?: string
}
