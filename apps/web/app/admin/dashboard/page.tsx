'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, FileText, TrendingUp, AlertCircle,
  ShoppingCart, RefreshCcw, Clock, CheckCircle, HeadphonesIcon,
} from 'lucide-react'
import { api } from '@/lib/api'
import { MetricCard } from '@/components/ui/card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, ORDER_STATUS_LABELS } from '@/lib/api/orders'

interface DashboardStats {
  mrr: number
  activeClients: number
  openInvoices: number
  overdueInvoices: number
  openTickets: number
  pendingOrders: number
  activeSubscriptions: number
  recentOrders: Array<{
    id: string
    status: string
    total: string
    createdAt: string
    client?: { id: string; name: string }
    plan?: { name: string }
  }>
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  CANCELLED: 'danger',
  FRAUD: 'danger',
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats/dashboard')
      .then((r) => setStats(r.data?.data ?? r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const metrics = stats
    ? [
        {
          title: 'MRR',
          value: formatCurrency(stats.mrr),
          description: 'Receita mensal recorrente',
          icon: <TrendingUp />,
        },
        {
          title: 'Clientes ativos',
          value: String(stats.activeClients),
          description: 'Total de clientes pagantes',
          icon: <Users />,
        },
        {
          title: 'Faturas em aberto',
          value: String(stats.openInvoices),
          description: 'Aguardando pagamento',
          icon: <FileText />,
        },
        {
          title: 'Assinaturas ativas',
          value: String(stats.activeSubscriptions),
          description: 'Planos recorrentes ativos',
          icon: <RefreshCcw />,
        },
      ]
    : []

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-h2 font-bold">Visão Geral</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Acompanhe o desempenho da sua operação em tempo real.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))
          : metrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Needs Attention */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <CardTitle>Precisa de atenção</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))
            ) : (
              <>
                {(stats?.pendingOrders ?? 0) > 0 && (
                  <AttentionItem
                    count={stats!.pendingOrders}
                    label="Pedidos aguardando ativação"
                    action="Ver pedidos"
                    href="/admin/orders?status=PENDING"
                    severity="warning"
                  />
                )}
                {(stats?.overdueInvoices ?? 0) > 0 && (
                  <AttentionItem
                    count={stats!.overdueInvoices}
                    label="Faturas vencidas sem pagamento"
                    action="Ver faturas"
                    href="/admin/invoices?status=OVERDUE"
                    severity="error"
                  />
                )}
                {(stats?.openInvoices ?? 0) > 0 && (
                  <AttentionItem
                    count={stats!.openInvoices}
                    label="Faturas aguardando pagamento"
                    action="Ver faturas"
                    href="/admin/invoices?status=OPEN"
                    severity="warning"
                  />
                )}
                {(stats?.openTickets ?? 0) > 0 && (
                  <AttentionItem
                    count={stats!.openTickets}
                    label="Chamados de suporte em aberto"
                    action="Ver suporte"
                    href="/admin/support"
                    severity="warning"
                  />
                )}
                {stats && stats.pendingOrders === 0 && stats.overdueInvoices === 0 && stats.openInvoices === 0 && stats.openTickets === 0 && (
                  <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <CheckCircle className="h-8 w-8 text-success" />
                    <p className="text-sm text-muted-foreground">Tudo em dia!</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pedidos recentes</CardTitle>
              <button
                onClick={() => router.push('/admin/orders')}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Ver todos
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : !stats?.recentOrders?.length ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
              </div>
            ) : (
              <div className="divide-y">
                {stats.recentOrders.map((order, i) => (
                  <div
                    key={order.id}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className="flex cursor-pointer items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/20 -mx-1 px-1 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{order.client?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.plan?.name ?? '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={STATUS_VARIANTS[order.status] ?? 'outline'} className="text-xs">
                        {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
                      </Badge>
                      <p className="text-sm font-medium w-24 text-right">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-muted-foreground w-20 text-right">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Ações rápidas:</span>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/clients')}>
              Novo cliente
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/orders')}>
              Novo pedido
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/invoices')}>
              Ver faturas
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/subscriptions')}>
              Assinaturas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AttentionItem({
  count, label, action, href, severity,
}: {
  count: number
  label: string
  action: string
  href: string
  severity: 'error' | 'warning'
}) {
  const router = useRouter()
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
            severity === 'error'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-warning/10 text-warning'
          }`}
        >
          {count}
        </span>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <button
        onClick={() => router.push(href)}
        className="shrink-0 text-[11px] font-medium text-primary hover:underline"
      >
        {action}
      </button>
    </div>
  )
}
