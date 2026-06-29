'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, INVOICE_STATUS_LABELS } from '@/lib/api/orders'
import { FileText, CheckCircle2, CreditCard, Copy, Check } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface PortalInvoice {
  id: string
  number: string
  status: string
  total: string
  dueDate: string
  paidAt?: string
  createdAt: string
  payments?: Array<{ id: string; status: string; pixCode?: string; method: string }>
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  DRAFT: 'outline', OPEN: 'warning', PAID: 'success',
  OVERDUE: 'danger', CANCELLED: 'outline', REFUNDED: 'outline',
}

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [generating, setGenerating] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  function handleCopy(pixCode: string, paymentId: string) {
    navigator.clipboard.writeText(pixCode).then(() => {
      setCopied(paymentId)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/portal/invoices', {
        params: { status: status || undefined },
      })
      setInvoices(res.data.data ?? res.data)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { fetch() }, [fetch])

  async function handleGeneratePix(invoiceId: string) {
    setGenerating(invoiceId)
    try {
      await api.post('/portal/payments', { invoiceId, method: 'PIX' })
      await fetch()
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 font-bold text-foreground">Minhas faturas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Histórico de cobranças e pagamentos.
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="OPEN,OVERDUE">A pagar</SelectItem>
            <SelectItem value="OPEN">Em aberto</SelectItem>
            <SelectItem value="OVERDUE">Vencida</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma fatura encontrada"
          description="Suas faturas aparecerão aqui quando forem geradas."
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const pendingPix = inv.payments?.find((p) => p.status === 'PENDING' && p.method === 'PIX')
            const canPay = ['OPEN', 'OVERDUE'].includes(inv.status)
            return (
              <Card key={inv.id} className={canPay ? 'border-warning/40' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        inv.status === 'PAID' ? 'bg-success/10' : canPay ? 'bg-warning/10' : 'bg-muted'
                      }`}>
                        {inv.status === 'PAID'
                          ? <CheckCircle2 className="h-5 w-5 text-success" />
                          : <FileText className={`h-5 w-5 ${canPay ? 'text-warning' : 'text-muted-foreground'}`} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{inv.number}</p>
                          <Badge variant={STATUS_VARIANTS[inv.status] ?? 'outline'} className="text-xs">
                            {INVOICE_STATUS_LABELS[inv.status as keyof typeof INVOICE_STATUS_LABELS] ?? inv.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {inv.status === 'PAID' && inv.paidAt
                            ? `Pago em ${new Date(inv.paidAt).toLocaleDateString('pt-BR')}`
                            : `Vencimento: ${new Date(inv.dueDate).toLocaleDateString('pt-BR')}`}
                        </p>
                        {pendingPix && (
                          <div className="mt-2 rounded-lg bg-muted p-2">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[10px] font-medium text-muted-foreground">Chave PIX Copia e Cola:</p>
                              <button
                                onClick={() => handleCopy(pendingPix.pixCode!, pendingPix.id)}
                                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors hover:bg-background"
                              >
                                {copied === pendingPix.id
                                  ? <><Check className="h-3 w-3 text-success" /> Copiado!</>
                                  : <><Copy className="h-3 w-3" /> Copiar</>}
                              </button>
                            </div>
                            <p className="break-all font-mono text-xs text-foreground select-all">
                              {pendingPix.pixCode}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-lg font-bold">{formatCurrency(inv.total)}</p>
                      {canPay && !pendingPix && (
                        <Button
                          size="sm"
                          onClick={() => handleGeneratePix(inv.id)}
                          loading={generating === inv.id}
                        >
                          <CreditCard className="mr-2 h-4 w-4" /> Pagar via PIX
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
