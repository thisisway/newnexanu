'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  RefreshCw, MoreHorizontal, Play, Pause, XCircle,
  Clock, CheckCircle, AlertTriangle, TrendingUp,
} from 'lucide-react'
import {
  subscriptionsApi, Subscription,
  SUBSCRIPTION_STATUS_LABELS, CYCLE_LABELS, formatCurrency,
} from '@/lib/api/orders'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, Pagination, Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  TRIAL: 'warning',
  ACTIVE: 'success',
  PAST_DUE: 'destructive',
  SUSPENDED: 'warning',
  CANCELLED: 'destructive',
  EXPIRED: 'outline',
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const [subs, setSubs] = useState<Subscription[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const fetchSubs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await subscriptionsApi.list({ status: status || undefined, page, limit: 20 })
      setSubs(res.data ?? res)
      if (res.total !== undefined) setMeta(res)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => { fetchSubs() }, [fetchSubs])

  async function handleSuspend(id: string) {
    if (!confirm('Suspender esta assinatura?')) return
    await subscriptionsApi.suspend(id)
    fetchSubs()
  }

  async function handleReactivate(id: string) {
    await subscriptionsApi.reactivate(id)
    fetchSubs()
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancelar esta assinatura imediatamente?')) return
    await subscriptionsApi.cancel(id, false)
    fetchSubs()
  }

  async function handleCancelAtEnd(id: string) {
    await subscriptionsApi.cancel(id, true)
    fetchSubs()
  }

  const active = subs.filter((s) => s.status === 'ACTIVE').length
  const suspended = subs.filter((s) => s.status === 'SUSPENDED').length
  const overdue = subs.filter((s) => s.status === 'PAST_DUE').length

  const columns: Column<Subscription>[] = [
    {
      key: 'plan',
      header: 'Plano',
      cell: (row) => (
        <div>
          <p className="font-medium">{row.order?.plan?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">
            {row.order?.billingCycle ? CYCLE_LABELS[row.order.billingCycle] : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.client?.name}</p>
          <p className="text-xs text-muted-foreground">{row.client?.email}</p>
        </div>
      ),
    },
    {
      key: 'mrr',
      header: 'Valor',
      cell: (row) => (
        <p className="font-medium">{row.order?.total ? formatCurrency(row.order.total) : '—'}</p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <Badge variant={STATUS_VARIANTS[row.status] ?? 'outline'}>
            {SUBSCRIPTION_STATUS_LABELS[row.status]}
          </Badge>
          {row.cancelAtPeriodEnd && (
            <span className="text-xs text-muted-foreground">Cancela ao fim do período</span>
          )}
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Próxima cobrança',
      cell: (row) => (
        row.status === 'ACTIVE' || row.status === 'TRIAL' ? (
          <div>
            <p className="text-sm">{new Date(row.nextBillingDate).toLocaleDateString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">
              Período: {new Date(row.currentPeriodStart).toLocaleDateString('pt-BR')} –{' '}
              {new Date(row.currentPeriodEnd).toLocaleDateString('pt-BR')}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/orders/${row.orderId}`) }}>
              Ver pedido
            </DropdownMenuItem>
            {row.status === 'ACTIVE' && (
              <>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCancelAtEnd(row.id) }}>
                  <XCircle className="mr-2 h-4 w-4" /> Cancelar ao fim do período
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSuspend(row.id) }}>
                  <Pause className="mr-2 h-4 w-4" /> Suspender
                </DropdownMenuItem>
              </>
            )}
            {row.status === 'SUSPENDED' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReactivate(row.id) }}>
                <Play className="mr-2 h-4 w-4 text-success" /> Reativar
              </DropdownMenuItem>
            )}
            {!['CANCELLED', 'EXPIRED'].includes(row.status) && (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); handleCancel(row.id) }}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" /> Cancelar agora
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 font-semibold text-foreground">Assinaturas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie as assinaturas recorrentes dos seus clientes.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{active}</p>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Pause className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{suspended}</p>
              <p className="text-xs text-muted-foreground">Suspensas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overdue}</p>
              <p className="text-xs text-muted-foreground">Inadimplentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{meta.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ACTIVE">Ativa</SelectItem>
            <SelectItem value="TRIAL">Trial</SelectItem>
            <SelectItem value="PAST_DUE">Inadimplente</SelectItem>
            <SelectItem value="SUSPENDED">Suspensa</SelectItem>
            <SelectItem value="CANCELLED">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => fetchSubs()} title="Atualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div>
        <DataTable
          columns={columns}
          data={subs}
          loading={loading}
          onRowClick={(row) => router.push(`/admin/orders/${row.orderId}`)}
          emptyState={
            <EmptyState
              icon={Clock}
              title="Nenhuma assinatura encontrada"
              description="As assinaturas são criadas automaticamente ao ativar pedidos recorrentes."
            />
          }
        />
        {meta.total > 0 && (
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  )
}
