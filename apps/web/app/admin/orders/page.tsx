'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ShoppingCart, RefreshCw, Eye, CheckCircle, XCircle,
  Clock, AlertTriangle, TrendingUp, Plus,
} from 'lucide-react'
import {
  ordersApi, Order, ORDER_STATUS_LABELS, CYCLE_LABELS, formatCurrency,
} from '@/lib/api/orders'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OrderFormDrawer } from './components/order-form-drawer'
import { DataTable, Pagination, Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MoreHorizontal } from 'lucide-react'

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  CANCELLED: 'danger',
  FRAUD: 'danger',
}

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [clientId] = useState(searchParams.get('clientId') ?? '')
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ordersApi.list({ status: status || undefined, clientId: clientId || undefined, page, limit: 20 })
      setOrders(res.data ?? res)
      if (res.total !== undefined) setMeta(res)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }, [status, clientId, page])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function handleActivate(id: string) {
    await ordersApi.activate(id)
    fetchOrders()
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancelar este pedido?')) return
    await ordersApi.cancel(id)
    fetchOrders()
  }

  const pending = orders.filter((o) => o.status === 'PENDING').length
  const active = orders.filter((o) => o.status === 'ACTIVE').length

  const columns: Column<Order>[] = [
    {
      key: 'id',
      header: 'Pedido',
      cell: (row) => (
        <div>
          <p className="font-mono text-xs text-muted-foreground">#{row.id.slice(-8).toUpperCase()}</p>
          <p className="text-sm font-medium text-foreground">{row.plan?.name}</p>
          <p className="text-xs text-muted-foreground">{CYCLE_LABELS[row.billingCycle]}</p>
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
      key: 'total',
      header: 'Valor',
      cell: (row) => (
        <div>
          <p className="font-medium">{formatCurrency(row.total)}</p>
          {Number(row.setupFee) > 0 && (
            <p className="text-xs text-muted-foreground">+ {formatCurrency(row.setupFee)} setup</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status] ?? 'outline'}>
          {ORDER_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      key: 'invoices',
      header: 'Faturas',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row._count?.invoices ?? 0} fatura{(row._count?.invoices ?? 0) !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Data',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString('pt-BR')}
        </span>
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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/orders/${row.id}`) }}>
              <Eye className="mr-2 h-4 w-4" /> Ver detalhes
            </DropdownMenuItem>
            {row.status === 'PENDING' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleActivate(row.id) }}>
                <CheckCircle className="mr-2 h-4 w-4 text-success" /> Ativar pedido
              </DropdownMenuItem>
            )}
            {!['CANCELLED', 'FRAUD'].includes(row.status) && (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); handleCancel(row.id) }}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" /> Cancelar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Drawer */}
      <OrderFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => { setDrawerOpen(false); fetchOrders() }}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 font-semibold text-foreground">Pedidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe e gerencie os pedidos dos seus clientes.
          </p>
        </div>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo pedido
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pending}</p>
              <p className="text-xs text-muted-foreground">Aguardando ativação</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{active}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
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
              <p className="text-xs text-muted-foreground">Total de pedidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {orders.filter((o) => o.status === 'FRAUD').length}
              </p>
              <p className="text-xs text-muted-foreground">Marcados como fraude</p>
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
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="SUSPENDED">Suspenso</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => fetchOrders()} title="Atualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div>
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
          emptyState={
            <EmptyState
              icon={ShoppingCart}
              title="Nenhum pedido encontrado"
              description="Os pedidos dos seus clientes aparecerão aqui."
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
