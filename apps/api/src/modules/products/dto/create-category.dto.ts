import { IsInt, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateCategoryDto {
  @IsString() name: string
  @IsString() slug: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsString() icon?: string
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number
}
