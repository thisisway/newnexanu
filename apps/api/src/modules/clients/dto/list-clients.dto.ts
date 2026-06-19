import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { ClientStatus, ClientType } from '@prisma/client'

export class ListClientsDto {
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsEnum(ClientStatus) status?: ClientStatus
  @IsOptional() @IsEnum(ClientType) type?: ClientType
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20
}
