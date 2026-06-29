'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, CheckCircle, XCircle, CreditCard, User,
  Calendar, Package, Receipt, Mail, Copy, Check,
} from 'lucide-react'
import {
  invoicesApi, paymentsApi, Invoice, Payment,
  INVOICE_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, formatCurrency,
} from '@/lib/api/orders'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  DRAFT: 'outline',
  OPEN: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'outline',
  REFUNDED: 'outline',
}

const PAYMENT_STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  PENDING: 'warning',
  PROCESSING: 'warning',
  PAID: 'success',
  FAILED: 'danger',
  CANCELLED: 'outline',
  REFUNDED: 'outline',
  CHARGEBACK: 'danger',
}

export default function InvoiceDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [payMethod, setPayMethod] = useState<Payment['method']>('PIX')
  const [generating, setGenerating] = useState(false)
  const [acting, setActing] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [copied, setCopied] = useState('')

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  async function refresh() {
    const [inv, pays] = await Promise.all([
      invoicesApi.get(id),
      paymentsApi.list({ invoiceId: id }),
    ])
    setInvoice(inv)
    setPayments(pays.data ?? pays)
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [id])

  async function handleMarkPaid() {
    if (!invoice) return
    setActing(true)
    try { await invoicesApi.markPaid(invoice.id); await refresh() }
    finally { setActing(false) }
  }

  async function handleCancel() {
    if (!invoice || !confirm('Cancelar esta fatura?')) return
    setActing(true)
    try { await invoicesApi.cancel(invoice.id); await refresh() }
    finally { setActing(false) }
  }

  async function handleGeneratePayment() {
    if (!invoice) return
    setGenerating(true)
    try {
      await paymentsApi.create({ invoiceId: invoice.id, method: payMethod })
      await refresh()
    } finally {
      setGenerating(false)
    }
  }

  async function handleConfirmPayment(payId: string) {
    await paymentsApi.confirm(payId)
    await refresh()
  }

  async function handleSendEmail() {
    if (!invoice) return
    setSendingEmail(true)
    try {
      await api.post(`/admin/invoices/${invoice.id}/send-email`)
      toast({ title: 'E-mail enviado!', description: `Fatura enviada para ${(invoice as any).client?.email}` })
    } catch (e: any) {
      toast({ title: 'Erro ao enviar', description: e?.response?.data?.message ?? 'Verifique as configurações SMTP.', variant: 'destructive' })
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando fatura...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Fatura não encontrada.</p>
        <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  const canAct = ['OPEN', 'OVERDUE'].includes(invoice.status)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-h2 font-semibold text-foreground">{invoice.number}</h1>
              <Badge variant={STATUS_VARIANTS[invoice.status] ?? 'outline'}>
                {INVOICE_STATUS_LABELS[invoice.status]}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleSendEmail} loading={sendingEmail}>
            <Mail className="mr-2 h-4 w-4" /> Enviar por e-mail
          </Button>
          {canAct && (
            <>
              <Button size="sm" onClick={handleMarkPaid} disabled={acting}>
                <CheckCircle className="mr-2 h-4 w-4" /> Marcar pago
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={acting}>
                <XCircle className="mr-2 h-4 w-4" /> Cancelar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Line items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" /> Itens
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!invoice.items || invoice.items.length === 0) ? (
                <p className="text-sm text-muted-foreground">Sem itens.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="pb-2 text-left font-medium">Descrição</th>
                      <th className="pb-2 text-right font-medium">Qtd</th>
                      <th className="pb-2 text-right font-medium">Unit.</th>
                      <th className="pb-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <Separator className="my-4" />
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {Number(invoice.discount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="text-success">- {formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                {Number(invoice.tax) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impostos</span>
                    <span>{formatCurrency(invoice.tax)}</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" /> Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
              ) : (
                <div className="divide-y">
                  {payments.map((pay) => (
                    <div key={pay.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{PAYMENT_METHOD_LABELS[pay.method]}</p>
                          <Badge variant={PAYMENT_STATUS_VARIANTS[pay.status] ?? 'outline'} className="text-xs">
                            {PAYMENT_STATUS_LABELS[pay.status] ?? pay.status}
                          </Badge>
                        </div>
                        {pay.pixCode && (
                          <div className="mt-1 flex items-center gap-2">
                            <p className="max-w-xs truncate font-mono text-xs text-muted-foreground">
                              {pay.pixCode}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleCopy(pay.pixCode!, pay.id)}
                              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              {copied === pay.id
                                ? <><Check className="h-3 w-3 text-success" /> Copiado!</>
                                : <><Copy className="h-3 w-3" /> Copiar</>}
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(pay.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{formatCurrency(pay.amount)}</p>
                        {pay.status === 'PENDING' && (
                          <Button size="sm" variant="outline" onClick={() => handleConfirmPayment(pay.id)}>
                            Confirmar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {canAct && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Select value={payMethod} onValueChange={(v) => setPayMethod(v as Payment['method'])}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="BOLETO">Boleto</SelectItem>
                        <SelectItem value="CREDIT_CARD">Cartão de crédito</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Transferência</SelectItem>
                        <SelectItem value="BALANCE">Saldo em conta</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleGeneratePayment} disabled={generating} variant="outline">
                      <Receipt className="mr-2 h-4 w-4" />
                      {generating ? 'Gerando...' : 'Gerar cobrança'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* Client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" /> Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="font-medium">{invoice.client?.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.client?.email}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => router.push(`/admin/clients/${invoice.clientId}`)}
              >
                Ver perfil
              </Button>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" /> Datas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Criada em</p>
                <p className="text-sm">{new Date(invoice.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vencimento</p>
                <p className="text-sm">{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</p>
              </div>
              {invoice.paidAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Pago em</p>
                  <p className="text-sm">{new Date(invoice.paidAt).toLocaleString('pt-BR')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked order */}
          {invoice.orderId && (
            <Card>
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/admin/orders/${invoice.orderId}`)}
                >
                  <Package className="mr-2 h-4 w-4" /> Ver pedido vinculado
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
