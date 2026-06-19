import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class CreateNoteDto {
  @IsString() content: string
  @IsOptional() @IsBoolean() isInternal?: boolean
}
