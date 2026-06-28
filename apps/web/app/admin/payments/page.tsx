'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreditCard, RefreshCw, MoreHorizontal, CheckCircle, Eye,
  TrendingUp, Clock, AlertTriangle,
} from 'lucide-react'
import {
  paymentsApi, Payment, PAYMENT_METHOD_LABELS, formatCurrency,
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
  PENDING: 'warning',
  PROCESSING: 'warning',
  PAID: 'success',
  FAILED: 'danger',
  CANCELLED: 'outline',
  REFUNDED: 'outline',
  CHARGEBACK: 'danger',
}

const STATUS_LABELS: Record<Payment['status'], string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
  CHARGEBACK: 'Chargeback',
}

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await paymentsApi.list({ status: status || undefined, page, limit: 20 })
      setPayments(res.data ?? res)
      if (res.total !== undefined) setMeta(res)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  async function handleConfirm(id: string) {
    await paymentsApi.confirm(id)
    fetchPayments()
  }

  const paid = payments.filter((p) => p.status === 'PAID')
  const totalPaid = paid.reduce((s, p) => s + Number(p.amount), 0)
  const pending = payments.filter((p) => p.status === 'PENDING').length

  const columns: Column<Payment>[] = [
    {
      key: 'method',
      header: 'Método',
      cell: (row) => (
        <div>
          <p className="font-medium">{PAYMENT_METHOD_LABELS[row.method]}</p>
          <p className="font-mono text-xs text-muted-foreground">#{row.id.slice(-8).toUpperCase()}</p>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.client?.name ?? '—'}</p>
          {row.invoice && (
            <p className="text-xs text-muted-foreground">{row.invoice.number}</p>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Valor',
      cell: (row) => <p className="font-medium">{formatCurrency(row.amount)}</p>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status] ?? 'outline'}>
          {STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      key: 'paidAt',
      header: 'Pago em',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.paidAt ? new Date(row.paidAt).toLocaleString('pt-BR') : '—'}
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
            {row.invoice?.id && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/invoices/${row.invoiceId}`) }}>
                <Eye className="mr-2 h-4 w-4" /> Ver fatura
              </DropdownMenuItem>
            )}
            {row.status === 'PENDING' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleConfirm(row.id) }}>
                <CheckCircle className="mr-2 h-4 w-4 text-success" /> Confirmar pagamento
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
          <h1 className="text-h2 font-semibold text-foreground">Pagamentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Histórico de pagamentos e cobranças.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-muted-foreground">Total recebido</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pending}</p>
              <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
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
                {payments.filter((p) => p.status === 'CHARGEBACK').length}
              </p>
              <p className="text-xs text-muted-foreground">Chargebacks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{meta.total}</p>
              <p className="text-xs text-muted-foreground">Total de transações</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
            <SelectItem value="FAILED">Falhou</SelectItem>
            <SelectItem value="REFUNDED">Reembolsado</SelectItem>
            <SelectItem value="CHARGEBACK">Chargeback</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => fetchPayments()} title="Atualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div>
        <DataTable
          columns={columns}
          data={payments}
          loading={loading}
          emptyState={
            <EmptyState
              icon={CreditCard}
              title="Nenhum pagamento encontrado"
              description="Os pagamentos gerados pelas faturas aparecerão aqui."
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
