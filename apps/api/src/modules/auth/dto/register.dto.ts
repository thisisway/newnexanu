import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator'

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  @MaxLength(100)
  name: string

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  @MaxLength(128)
  password: string

  @IsString()
  @MinLength(2, { message: 'O nome da organização deve ter no mínimo 2 caracteres.' })
  @MaxLength(100)
  organizationName: string

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'O slug deve conter apenas letras minúsculas, números e hífens.',
  })
  organizationSlug: string
}
