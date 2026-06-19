import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { BillingCycle, PlanStatus } from '@prisma/client'

class PlanPriceDto {
  @IsEnum(BillingCycle) cycle: BillingCycle
  @IsString() amount: string
  @IsOptional() @IsString() setupFee?: string
  @IsOptional() @IsInt() trialDays?: number
  @IsOptional() @IsBoolean() isDefault?: boolean
  @IsOptional() @IsString() currency?: string
}

export class CreatePlanDto {
  @IsString() productId: string
  @IsString() name: string
  @IsString() slug: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsEnum(PlanStatus) status?: PlanStatus
  @IsOptional() features?: string[]
  @IsOptional() limits?: Record<string, any>
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number
  @IsOptional() @IsBoolean() isPopular?: boolean
  @IsOptional() @ValidateNested({ each: true }) @Type(() => PlanPriceDto) prices?: PlanPriceDto[]
}
