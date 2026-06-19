import { IsEmail, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ClientStatus, ClientType, DocumentType } from '@prisma/client'

class AddressDto {
  @IsOptional() @IsString() street?: string
  @IsOptional() @IsString() number?: string
  @IsOptional() @IsString() complement?: string
  @IsOptional() @IsString() neighborhood?: string
  @IsOptional() @IsString() city?: string
  @IsOptional() @IsString() state?: string
  @IsOptional() @IsString() zip?: string
  @IsOptional() @IsString() country?: string
}

export class CreateClientDto {
  @IsString() name: string
  @IsEmail() email: string
  @IsOptional() @IsString() document?: string
  @IsOptional() @IsEnum(DocumentType) documentType?: DocumentType
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() mobile?: string
  @IsOptional() @IsEnum(ClientType) type?: ClientType
  @IsOptional() @IsEnum(ClientStatus) status?: ClientStatus
  @IsOptional() @IsString() notes?: string
  @IsOptional() @ValidateNested() @Type(() => AddressDto) address?: AddressDto
}
