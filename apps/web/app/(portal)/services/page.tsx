'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Order, CYCLE_LABELS, formatCurrency } from '@/lib/api/orders'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Server, FileText, CalendarClock } from 'lucide-react'

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  ACTIVE: 'success', PENDING: 'warning', SUSPENDED: 'destructive', CANCELLED: 'outline', FRAUD: 'destructive',
}
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo', PENDING: 'Pendente', SUSPENDED: 'Suspenso', CANCELLED: 'Cancelado', FRAUD: 'Fraude',
}

export default function PortalServicesPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get('/portal/orders')
      .then((r) => setOrders(Array.isArray(r.data) ? r.data : r.data.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h2 font-bold text-foreground">Meus Serviços</h1>
          <p className="mt-1 text-sm text-muted-foreground">Seus serviços ativos.</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 font-bold text-foreground">Meus Serviços</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length} serviço{orders.length !== 1 ? 's' : ''} contratado{orders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
          <p className="text-sm text-muted-foreground">Não foi possível carregar seus serviços.</p>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Server}
          title="Nenhum serviço contratado"
          description="Você ainda não possui serviços ativos. Visite a loja para contratar."
          actions={[{ label: 'Ver loja', onClick: () => router.push('/portal/store') }]}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Card key={order.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status] ?? 'outline'} className="text-xs">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-foreground">{order.plan?.name ?? 'Serviço'}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {order.billingCycle ? CYCLE_LABELS[order.billingCycle] : ''}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                  </div>
                  {order.subscription?.nextBillingDate && (
                    <div className="text-right">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="h-3 w-3" /> Próx. renovação
                      </p>
                      <p className="text-xs font-medium">
                        {new Date(order.subscription.nextBillingDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push('/portal/invoices')}
                >
                  <FileText className="mr-2 h-3.5 w-3.5" /> Ver faturas
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
