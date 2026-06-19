import { IsString, MinLength, MaxLength, Matches, IsOptional, IsUrl } from 'class-validator'

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'O slug deve conter apenas letras minúsculas, números e hífens.',
  })
  slug: string

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Informe uma URL válida para o domínio.' })
  domain?: string
}
