import { IsString, IsOptional, IsEnum } from 'class-validator'

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'])
  status?: string

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  priority?: string

  @IsOptional()
  @IsString()
  assignedToId?: string | null

  @IsOptional()
  @IsString()
  category?: string
}
