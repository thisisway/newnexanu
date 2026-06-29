'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  FileText, RefreshCw, Eye, CheckCircle, XCircle,
  Clock, AlertTriangle, TrendingUp, MoreHorizontal,
} from 'lucide-react'
import {
  invoicesApi, Invoice, INVOICE_STATUS_LABELS, formatCurrency,
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

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  DRAFT: 'outline',
  OPEN: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'outline',
  REFUNDED: 'outline',
}

export default function InvoicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [clientId] = useState(searchParams.get('clientId') ?? '')
  const [page, setPage] = useState(1)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await invoicesApi.list({ status: status || undefined, clientId: clientId || undefined, page, limit: 20 })
      setInvoices(res.data ?? res)
      if (res.total !== undefined) setMeta(res)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }, [status, clientId, page])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  async function handleMarkPaid(id: string) {
    if (!confirm('Marcar como paga manualmente? Use somente para conciliação.')) return
    try { await invoicesApi.markPaid(id) } catch { alert('Erro ao marcar fatura como paga.') }
    fetchInvoices()
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancelar esta fatura?')) return
    await invoicesApi.cancel(id)
    fetchInvoices()
  }

  const open = invoices.filter((i) => i.status === 'OPEN').length
  const overdue = invoices.filter((i) => i.status === 'OVERDUE').length
  const totalPaid = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + Number(i.total), 0)

  const columns: Column<Invoice>[] = [
    {
      key: 'number',
      header: 'Fatura',
      cell: (row) => (
        <div>
          <p className="font-medium">{row.number}</p>
          <p className="text-xs text-muted-foreground">
            Venc. {new Date(row.dueDate).toLocaleDateString('pt-BR')}
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
      key: 'total',
      header: 'Total',
      cell: (row) => (
        <p className="font-medium">{formatCurrency(row.total)}</p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status] ?? 'outline'}>
          {INVOICE_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      key: 'paidAt',
      header: 'Pago em',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.paidAt ? new Date(row.paidAt).toLocaleDateString('pt-BR') : '—'}
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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/invoices/${row.id}`) }}>
              <Eye className="mr-2 h-4 w-4" /> Ver detalhes
            </DropdownMenuItem>
            {['OPEN', 'OVERDUE'].includes(row.status) && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkPaid(row.id) }}>
                <CheckCircle className="mr-2 h-4 w-4 text-success" /> Marcar como pago
              </DropdownMenuItem>
            )}
            {!['CANCELLED', 'PAID', 'REFUNDED'].includes(row.status) && (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); handleCancel(row.id) }}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" /> Cancelar fatura
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
          <h1 className="text-h2 font-semibold text-foreground">Faturas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie as faturas e cobranças dos seus clientes.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{open}</p>
              <p className="text-xs text-muted-foreground">Em aberto</p>
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
              <p className="text-xs text-muted-foreground">Vencidas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-muted-foreground">Total recebido</p>
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
              <p className="text-xs text-muted-foreground">Total de faturas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="OPEN">Em aberto</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
            <SelectItem value="OVERDUE">Vencida</SelectItem>
            <SelectItem value="CANCELLED">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => fetchInvoices()} title="Atualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div>
        <DataTable
          columns={columns}
          data={invoices}
          loading={loading}
          onRowClick={(row) => router.push(`/admin/invoices/${row.id}`)}
          emptyState={
            <EmptyState
              icon={FileText}
              title="Nenhuma fatura encontrada"
              description="As faturas geradas automaticamente pelos pedidos aparecerão aqui."
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
