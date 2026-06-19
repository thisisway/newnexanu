import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator'

export class CreateContactDto {
  @IsString() name: string
  @IsOptional() @IsEmail() email?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() role?: string
  @IsOptional() @IsBoolean() isPrimary?: boolean
}
