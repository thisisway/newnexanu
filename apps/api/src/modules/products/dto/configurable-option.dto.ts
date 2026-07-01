import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ConfigurableOptionType, ConfigurableOptionStatus } from '@prisma/client'

class OptionValueDto {
  @IsString() label: string
  @IsOptional() @IsString() priceModifier?: string
  @IsOptional() @IsInt() sortOrder?: number
}

export class CreateConfigurableOptionDto {
  @IsString() name: string
  @IsOptional() @IsEnum(ConfigurableOptionType) type?: ConfigurableOptionType
  @IsOptional() @IsBoolean() required?: boolean
  @IsOptional() @IsInt() sortOrder?: number
  @IsOptional() @IsEnum(ConfigurableOptionStatus) status?: ConfigurableOptionStatus
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OptionValueDto) values?: OptionValueDto[]
}

export class UpdateConfigurableOptionDto {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsEnum(ConfigurableOptionType) type?: ConfigurableOptionType
  @IsOptional() @IsBoolean() required?: boolean
  @IsOptional() @IsInt() sortOrder?: number
  @IsOptional() @IsEnum(ConfigurableOptionStatus) status?: ConfigurableOptionStatus
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OptionValueDto) values?: OptionValueDto[]
}
