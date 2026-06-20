import { IsOptional, IsString, MaxLength, MinLength, Matches, IsUrl } from 'class-validator'

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'O slug deve conter apenas letras minúsculas, números e hífens.',
  })
  slug?: string

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Informe uma URL válida para o domínio.' })
  domain?: string

  @IsOptional()
  @IsString()
  logoUrl?: string
}
