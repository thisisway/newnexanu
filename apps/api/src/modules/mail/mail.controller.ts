import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common'
import { IsEmail } from 'class-validator'
import { MailService } from './mail.service'

class TestEmailDto {
  @IsEmail({}, { message: 'E-mail de destino inválido.' })
  to: string
}

@Controller('admin/settings/mail')
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Get()
  status() {
    return this.mail.smtpInfo()
  }

  @Post('test')
  async test(@Body() dto: TestEmailDto) {
    if (!this.mail.isConfigured()) {
      throw new BadRequestException('SMTP não configurado. Defina as variáveis de ambiente SMTP_HOST, SMTP_USER e SMTP_PASS.')
    }
    await this.mail.sendTest(dto.to)
    return { message: `E-mail de teste enviado para ${dto.to}` }
  }
}
