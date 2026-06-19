import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  slug: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[]
}
