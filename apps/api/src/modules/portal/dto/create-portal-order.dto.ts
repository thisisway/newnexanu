import { IsString, IsOptional } from 'class-validator'

export class CreatePortalOrderDto {
  @IsString() planId: string
  @IsString() planPriceId: string
  @IsOptional() @IsString() notes?: string
}
