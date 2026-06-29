import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter: Transporter | null = null

  constructor(private config: ConfigService) {
    this.init()
  }

  private init() {
    const host = this.config.get<string>('SMTP_HOST')
    const user = this.config.get<string>('SMTP_USER')
    const pass = this.config.get<string>('SMTP_PASS')

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured — email sending disabled. Set SMTP_HOST, SMTP_USER, SMTP_PASS to enable.')
      return
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.config.get('SMTP_PORT') ?? 587),
      secure: this.config.get('SMTP_SECURE') === 'true',
      auth: { user, pass },
    })

    this.logger.log(`SMTP configured: ${host}:${this.config.get('SMTP_PORT') ?? 587}`)
  }

  isConfigured(): boolean {
    return this.transporter !== null
  }

  smtpInfo() {
    return {
      configured: this.isConfigured(),
      host: this.config.get('SMTP_HOST') ?? null,
      port: Number(this.config.get('SMTP_PORT') ?? 587),
      user: this.config.get('SMTP_USER') ?? null,
      fromName: this.config.get('SMTP_FROM_NAME') ?? 'Nexano',
      fromEmail: this.config.get('SMTP_FROM_EMAIL') ?? this.config.get('SMTP_USER') ?? null,
    }
  }

  private get from(): string {
    const name = this.config.get('SMTP_FROM_NAME') ?? 'Nexano'
    const email = this.config.get('SMTP_FROM_EMAIL') ?? this.config.get('SMTP_USER') ?? ''
    return `"${name}" <${email}>`
  }

  private async send(opts: { to: string; subject: string; html: string }) {
    if (!this.transporter) {
      this.logger.warn(`Email not sent to ${opts.to} — SMTP not configured`)
      return
    }
    try {
      await this.transporter.sendMail({ from: this.from, ...opts })
      this.logger.log(`Email sent → ${opts.to}: ${opts.subject}`)
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}`, (err as Error).message)
    }
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    await this.send({
      to,
      subject: 'Redefinição de senha — Nexano',
      html: this.tpl(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Redefinição de senha</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
          Recebemos uma solicitação para redefinir a senha da sua conta.<br/>
          Clique no botão abaixo para criar uma nova senha. Este link expira em <strong>1 hora</strong>.
        </p>
        <a href="${resetUrl}" style="${this.btnStyle('#18181b')}">Redefinir senha</a>
        <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;">
          Se você não solicitou isso, ignore este e-mail. Sua senha permanece inalterada.
        </p>
      `),
    })
  }

  async sendInvoiceCreated(to: string, data: {
    clientName: string; invoiceNumber: string; total: string; dueDate: string; portalUrl: string
  }) {
    await this.send({
      to,
      subject: `Fatura #${data.invoiceNumber} gerada — Nexano`,
      html: this.tpl(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Nova fatura disponível</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
          Olá, <strong>${data.clientName}</strong>! Uma nova fatura foi gerada para você.
        </p>
        ${this.invoiceTable([
          ['Fatura', `#${data.invoiceNumber}`],
          ['Valor', `<strong>${data.total}</strong>`],
          ['Vencimento', data.dueDate],
        ], '#e4e4e7', '#f4f4f5')}
        <a href="${data.portalUrl}" style="${this.btnStyle('#18181b')}">Ver fatura e pagar</a>
      `),
    })
  }

  async sendInvoiceOverdue(to: string, data: {
    clientName: string; invoiceNumber: string; total: string; dueDate: string; portalUrl: string
  }) {
    await this.send({
      to,
      subject: `Fatura #${data.invoiceNumber} vencida — Nexano`,
      html: this.tpl(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#dc2626;">Fatura vencida</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
          Olá, <strong>${data.clientName}</strong>! A fatura abaixo está vencida.
          Por favor efetue o pagamento para evitar a suspensão dos seus serviços.
        </p>
        ${this.invoiceTable([
          ['Fatura', `#${data.invoiceNumber}`],
          ['Valor', `<strong style="color:#dc2626;">${data.total}</strong>`],
          ['Venceu em', `<span style="color:#dc2626;">${data.dueDate}</span>`],
        ], '#fca5a5', '#fef2f2')}
        <a href="${data.portalUrl}" style="${this.btnStyle('#dc2626')}">Pagar agora</a>
      `),
    })
  }

  async sendInvoiceEmail(to: string, data: {
    clientName: string; invoiceNumber: string; total: string; dueDate: string; portalUrl: string
  }) {
    await this.sendInvoiceCreated(to, data)
  }

  async sendTicketCreated(to: string, data: {
    clientName: string; ticketNumber: number; subject: string; portalUrl: string
  }) {
    await this.send({
      to,
      subject: `Chamado #${data.ticketNumber} aberto — Nexano`,
      html: this.tpl(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Chamado aberto com sucesso</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
          Olá, <strong>${data.clientName}</strong>! Seu chamado foi registrado e nossa equipe entrará em contato em breve.
        </p>
        ${this.invoiceTable([
          ['Chamado', `#${data.ticketNumber}`],
          ['Assunto', data.subject],
        ], '#e4e4e7', '#f4f4f5')}
        <a href="${data.portalUrl}" style="${this.btnStyle('#18181b')}">Ver chamado</a>
      `),
    })
  }

  async sendTicketReply(to: string, data: {
    clientName: string; ticketNumber: number; subject: string; body: string; portalUrl: string
  }) {
    await this.send({
      to,
      subject: `Resposta no chamado #${data.ticketNumber} — Nexano`,
      html: this.tpl(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Nova resposta no seu chamado</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#71717a;line-height:1.6;">
          Olá, <strong>${data.clientName}</strong>! Sua equipe de suporte respondeu ao chamado
          <strong>#${data.ticketNumber} — ${data.subject}</strong>.
        </p>
        <div style="border:1px solid #e4e4e7;border-radius:8px;padding:16px;margin-bottom:24px;background:#f9f9f9;">
          <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.7;white-space:pre-wrap;">${this.escapeHtml(data.body)}</p>
        </div>
        <a href="${data.portalUrl}" style="${this.btnStyle('#18181b')}">Responder ao chamado</a>
      `),
    })
  }

  async sendTest(to: string) {
    await this.send({
      to,
      subject: 'Teste de e-mail — Nexano',
      html: this.tpl(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Teste de e-mail</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#71717a;line-height:1.6;">
          Se você recebeu este e-mail, a configuração SMTP do Nexano está funcionando corretamente.
        </p>
        <div style="display:inline-flex;align-items:center;gap:8px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;">
          <span style="font-size:14px;color:#16a34a;font-weight:600;">✓ Configuração SMTP OK</span>
        </div>
      `),
    })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private tpl(content: string) {
    return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
      <tr><td style="background:#18181b;padding:24px 32px;">
        <span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px;">Nexano</span>
      </td></tr>
      <tr><td style="padding:32px;">${content}</td></tr>
      <tr><td style="border-top:1px solid #e4e4e7;padding:20px 32px;background:#fafafa;">
        <p style="margin:0;font-size:12px;color:#71717a;text-align:center;">
          Você recebeu este e-mail porque possui uma conta no Nexano.<br/>
          &copy; ${new Date().getFullYear()} Nexano. Todos os direitos reservados.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
  }

  private btnStyle(bg: string) {
    return `display:inline-block;background:${bg};color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;`
  }

  private invoiceTable(rows: [string, string][], borderColor: string, bgColor: string) {
    return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${borderColor};border-radius:8px;overflow:hidden;margin-bottom:24px;">
      ${rows.map((row, i) => `
      <tr ${i % 2 === 0 ? `style="background:${bgColor};"` : ''}>
        <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#3f3f46;${i > 0 ? `border-top:1px solid ${borderColor};` : ''}">${row[0]}</td>
        <td style="padding:12px 16px;font-size:13px;color:#18181b;text-align:right;${i > 0 ? `border-top:1px solid ${borderColor};` : ''}">${row[1]}</td>
      </tr>`).join('')}
    </table>`
  }

  private escapeHtml(str: string) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
}
