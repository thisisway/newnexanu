import { IsEmail, IsString, MinLength, IsOptional, Length } from 'class-validator'

export class LoginDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  password: string

  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'O código 2FA deve ter 6 dígitos.' })
  twoFactorCode?: string
}
