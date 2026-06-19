import { IsEmail, IsOptional, IsString } from 'class-validator'

export class InviteUserDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string

  @IsOptional()
  @IsString()
  roleId?: string

  @IsOptional()
  @IsString()
  name?: string
}
