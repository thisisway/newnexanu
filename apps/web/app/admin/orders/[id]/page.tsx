'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, CheckCircle, XCircle, FileText, CreditCard,
  Clock, Calendar, Package, User,
} from 'lucide-react'
import {
  ordersApi, invoicesApi, Order, Invoice,
  ORDER_STATUS_LABELS, INVOICE_STATUS_LABELS, CYCLE_LABELS, formatCurrency,
} from '@/lib/api/orders'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const ORDER_STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  CANCELLED: 'destructive',
  FRAUD: 'destructive',
}

const INVOICE_STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  DRAFT: 'outline',
  OPEN: 'warning',
  PAID: 'success',
  OVERDUE: 'destructive',
  CANCELLED: 'outline',
  REFUNDED: 'outline',
}

export default function OrderDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    Promise.all([
      ordersApi.get(id),
      invoicesApi.list({ clientId: undefined, status: undefined, page: 1, limit: 50 }),
    ]).then(([ord, inv]) => {
      setOrder(ord)
      const list = inv.data ?? inv
      setInvoices(list.filter((i: Invoice) => i.orderId === id))
    }).finally(() => setLoading(false))
  }, [id])

  async function handleActivate() {
    if (!order) return
    setActing(true)
    try {
      const updated = await ordersApi.activate(order.id)
      setOrder(updated)
    } finally {
      setActing(false)
    }
  }

  async function handleCancel() {
    if (!order || !confirm('Cancelar este pedido?')) return
    setActing(true)
    try {
      const updated = await ordersApi.cancel(order.id)
      setOrder(updated)
    } finally {
      setActing(false)
    }
  }

  async function handleMarkInvoicePaid(invoiceId: string) {
    await invoicesApi.markPaid(invoiceId)
    const updated = await invoicesApi.list({ page: 1, limit: 50 })
    const list = updated.data ?? updated
    setInvoices(list.filter((i: Invoice) => i.orderId === id))
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando pedido...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Pedido não encontrado.</p>
        <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

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
              <h1 className="text-h2 font-semibold text-foreground">
                Pedido #{order.id.slice(-8).toUpperCase()}
              </h1>
              <Badge variant={ORDER_STATUS_VARIANTS[order.status] ?? 'outline'}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Criado em {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {order.status === 'PENDING' && (
            <Button onClick={handleActivate} disabled={acting}>
              <CheckCircle className="mr-2 h-4 w-4" /> Ativar pedido
            </Button>
          )}
          {!['CANCELLED', 'FRAUD'].includes(order.status) && (
            <Button variant="outline" onClick={handleCancel} disabled={acting}>
              <XCircle className="mr-2 h-4 w-4" /> Cancelar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: order info */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Plan details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" /> Plano contratado
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Plano</p>
                <p className="font-medium">{order.plan?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ciclo de cobrança</p>
                <p className="font-medium">{CYCLE_LABELS[order.billingCycle]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Quantidade</p>
                <p className="font-medium">{order.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor unitário</p>
                <p className="font-medium">{formatCurrency(order.unitPrice)}</p>
              </div>
              {Number(order.setupFee) > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Taxa de ativação</p>
                  <p className="font-medium">{formatCurrency(order.setupFee)}</p>
                </div>
              )}
              {Number(order.discount) > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Desconto</p>
                  <p className="font-medium text-success">- {formatCurrency(order.discount)}</p>
                </div>
              )}
              <Separator className="col-span-2" />
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{formatCurrency(order.total)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" /> Faturas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma fatura gerada.</p>
              ) : (
                <div className="divide-y">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{inv.number}</p>
                          <Badge variant={INVOICE_STATUS_VARIANTS[inv.status] ?? 'outline'} className="text-xs">
                            {INVOICE_STATUS_LABELS[inv.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Venc. {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                          {inv.paidAt && ` · Pago em ${new Date(inv.paidAt).toLocaleDateString('pt-BR')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{formatCurrency(inv.total)}</p>
                        {inv.status === 'OPEN' && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkInvoicePaid(inv.id)}>
                            Marcar pago
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/admin/invoices/${inv.id}`)}
                        >
                          Ver
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: sidebar */}
        <div className="flex flex-col gap-4">
          {/* Client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" /> Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="font-medium">{order.client?.name}</p>
              <p className="text-sm text-muted-foreground">{order.client?.email}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => router.push(`/admin/clients/${order.clientId}`)}
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
                <p className="text-xs text-muted-foreground">Criado em</p>
                <p className="text-sm">{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              {order.activatedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Ativado em</p>
                  <p className="text-sm">{new Date(order.activatedAt).toLocaleString('pt-BR')}</p>
                </div>
              )}
              {order.cancelledAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Cancelado em</p>
                  <p className="text-sm">{new Date(order.cancelledAt).toLocaleString('pt-BR')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription */}
          {order.subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" /> Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={order.subscription.status === 'ACTIVE' ? 'success' : 'outline'}>
                  {order.subscription.status}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
