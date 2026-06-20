import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { BillingCycle, PlanStatus } from '@prisma/client'

class UpdatePlanPriceDto {
  @IsOptional() @IsEnum(BillingCycle) cycle?: BillingCycle
  @IsOptional() @IsString() amount?: string
  @IsOptional() @IsString() setupFee?: string
  @IsOptional() @IsInt() trialDays?: number
  @IsOptional() @IsBoolean() isDefault?: boolean
  @IsOptional() @IsString() currency?: string
}

export class UpdatePlanDto {
  @IsOptional() @IsString() productId?: string
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() slug?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsEnum(PlanStatus) status?: PlanStatus
  @IsOptional() features?: string[]
  @IsOptional() limits?: Record<string, any>
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number
  @IsOptional() @IsBoolean() isPopular?: boolean
  @IsOptional() @ValidateNested({ each: true }) @Type(() => UpdatePlanPriceDto) prices?: UpdatePlanPriceDto[]
}
