import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import { ProductStatus, ProductType } from '@prisma/client'

export class CreateProductDto {
  @IsString() name: string
  @IsString() slug: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsString() categoryId?: string
  @IsOptional() @IsEnum(ProductType) type?: ProductType
  @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus
  @IsOptional() features?: string[]
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number
}
