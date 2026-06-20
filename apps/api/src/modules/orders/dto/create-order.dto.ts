import {
  IsString, IsEnum, IsOptional, IsInt, IsArray, ValidateNested, Min,
} from 'class-validator'
import { Type } from 'class-transformer'
import { BillingCycle } from '@prisma/client'

class OrderAddonDto {
  @IsString() addonId: string
  @IsInt() @Min(1) quantity: number
}

export class CreateOrderDto {
  @IsString() clientId: string
  @IsString() planId: string
  @IsString() planPriceId: string
  @IsEnum(BillingCycle) billingCycle: BillingCycle
  @IsOptional() @IsInt() @Min(1) quantity?: number
  @IsOptional() @IsString() notes?: string
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OrderAddonDto)
  addons?: OrderAddonDto[]
}
