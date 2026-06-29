'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/api/orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp, TrendingDown, Users, DollarSign, BarChart3, FileText, ShoppingCart,
} from 'lucide-react'

interface ReportData {
  mrr: number
  arr: number
  totalClients: number
  newClientsThisMonth: number
  newClientsLastMonth: number
  totalPaidRevenue: number
  revenueThisMonth: number
  revenueLastMonth: number
  invoiceStats: Record<string, number>
  topOrders: Array<{
    id: string
    total: string
    billingCycle: string
    plan?: { name: string }
    client?: { name: string }
  }>
}

function Delta({ current, previous, suffix = '' }: { current: number; previous: number; suffix?: string }) {
  if (previous === 0) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  const up = pct >= 0
  return (
    <span className={`flex items-center gap-0.5 text-xs ${up ? 'text-success' : 'text-destructive'}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct)}%{suffix}
    </span>
  )
}

function MetricCard({ title, value, sub, delta, previousValue, icon: Icon, iconClass }: {
  title: string
  value: string
  sub?: string
  delta?: { current: number; previous: number }
  previousValue?: string
  icon: React.ComponentType<{ className?: string }>
  iconClass?: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Icon className={`h-4 w-4 ${iconClass ?? 'text-muted-foreground'}`} />
          </div>
          {delta && <Delta current={delta.current} previous={delta.previous} />}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{title}</p>
          {previousValue && <p className="mt-1 text-[10px] text-muted-foreground">Mês anterior: {previousValue}</p>}
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

const CYCLE_LABELS: Record<string, string> = {
  MONTHLY: 'Mensal', QUARTERLY: 'Trimestral', SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual', BIANNUAL: 'Bianual', ONE_TIME: 'Único',
}

const INV_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho', OPEN: 'Em aberto', PAID: 'Pago',
  OVERDUE: 'Vencida', CANCELLED: 'Cancelada', REFUNDED: 'Reembolsada',
}
const INV_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  DRAFT: 'outline', OPEN: 'warning', PAID: 'success',
  OVERDUE: 'danger', CANCELLED: 'outline', REFUNDED: 'outline',
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats/reports')
      .then((r) => setData(r.data?.data ?? r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h2 font-semibold">Relatórios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Visão geral financeira e operacional.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data) return null

  const totalInvoices = Object.values(data.invoiceStats).reduce((s, v) => s + v, 0)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-h2 font-semibold text-foreground">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral financeira e operacional da organização.</p>
      </div>

      {/* Receita */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Receita</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="MRR (Receita mensal recorrente)"
            value={formatCurrency(data.mrr)}
            sub={`ARR: ${formatCurrency(data.arr)}`}
            icon={TrendingUp}
            iconClass="text-success"
          />
          <MetricCard
            title="Receita total (histórico)"
            value={formatCurrency(data.totalPaidRevenue)}
            sub="Soma de todos os pagamentos confirmados"
            icon={DollarSign}
            iconClass="text-primary"
          />
          <MetricCard
            title="Receita este mês"
            value={formatCurrency(data.revenueThisMonth)}
            previousValue={formatCurrency(data.revenueLastMonth)}
            delta={{ current: data.revenueThisMonth, previous: data.revenueLastMonth }}
            icon={BarChart3}
            iconClass="text-primary"
          />
          <MetricCard
            title="Receita mês anterior"
            value={formatCurrency(data.revenueLastMonth)}
            icon={BarChart3}
            iconClass="text-muted-foreground"
          />
        </div>
      </section>

      {/* Clientes */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Clientes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total de clientes"
            value={String(data.totalClients)}
            icon={Users}
            iconClass="text-primary"
          />
          <MetricCard
            title="Novos este mês"
            value={String(data.newClientsThisMonth)}
            previousValue={String(data.newClientsLastMonth)}
            delta={{ current: data.newClientsThisMonth, previous: data.newClientsLastMonth }}
            icon={Users}
            iconClass="text-success"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invoice breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Faturas por status</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Object.entries(data.invoiceStats).map(([status, count]) => {
              const pct = totalInvoices > 0 ? Math.round((count / totalInvoices) * 100) : 0
              return (
                <div key={status} className="flex items-center gap-3">
                  <Badge variant={INV_VARIANTS[status] ?? 'outline'} className="w-28 justify-center text-xs">
                    {INV_LABELS[status] ?? status}
                  </Badge>
                  <div className="flex-1 overflow-hidden rounded-full bg-muted h-2">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex w-20 items-center justify-end gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                </div>
              )
            })}
            {Object.keys(data.invoiceStats).length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma fatura ainda.</p>
            )}
          </CardContent>
        </Card>

        {/* Top orders by value */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Top serviços ativos por valor</CardTitle></CardHeader>
          <CardContent>
            {data.topOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido ativo.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.topOrders.map((order, idx) => (
                  <div key={order.id} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{order.plan?.name ?? 'Plano'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.client?.name} · {CYCLE_LABELS[order.billingCycle] ?? order.billingCycle}
                      </p>
                    </div>
                    <p className="text-sm font-semibold shrink-0">{formatCurrency(order.total)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
