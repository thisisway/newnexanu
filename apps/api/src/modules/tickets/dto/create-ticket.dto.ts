import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator'

export class CreateTicketDto {
  @IsOptional()
  @IsString()
  clientId?: string

  @IsString()
  @MinLength(5, { message: 'Assunto deve ter ao menos 5 caracteres.' })
  subject: string

  @IsString()
  @MinLength(10, { message: 'Mensagem deve ter ao menos 10 caracteres.' })
  body: string

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

  @IsOptional()
  @IsString()
  category?: string
}
