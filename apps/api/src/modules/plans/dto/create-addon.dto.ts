import { IsEnum, IsOptional, IsString } from 'class-validator'
import { AddonStatus, AddonType } from '@prisma/client'

export class CreateAddonDto {
  @IsString() name: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsString() planId?: string
  @IsEnum(AddonType) type: AddonType
  @IsString() price: string
  @IsOptional() @IsString() setupFee?: string
  @IsOptional() @IsEnum(AddonStatus) status?: AddonStatus
}
