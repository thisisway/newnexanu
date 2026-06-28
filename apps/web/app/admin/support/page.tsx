'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  HeadphonesIcon, RefreshCw, MoreHorizontal, Clock,
  AlertTriangle, CheckCircle, TrendingUp,
} from 'lucide-react'
import { ticketsApi, Ticket, TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/lib/api/tickets'
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
  OPEN: 'warning',
  IN_PROGRESS: 'default',
  WAITING_CLIENT: 'outline',
  RESOLVED: 'success',
  CLOSED: 'outline',
}

const PRIORITY_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  LOW: 'outline',
  MEDIUM: 'default',
  HIGH: 'warning',
  CRITICAL: 'danger',
}

export default function SupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ticketsApi.list({
        status: status || undefined,
        priority: priority || undefined,
        page,
        limit: 20,
      })
      setTickets(res.data ?? res)
      if (res.total !== undefined) setMeta(res)
    } finally {
      setLoading(false)
    }
  }, [status, priority, page])

  useEffect(() => { fetch() }, [fetch])

  async function handleStatus(id: string, newStatus: string) {
    await ticketsApi.update(id, { status: newStatus })
    fetch()
  }

  const open = tickets.filter((t) => t.status === 'OPEN').length
  const critical = tickets.filter((t) => t.priority === 'CRITICAL').length
  const resolved = tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length

  const columns: Column<Ticket>[] = [
    {
      key: 'number',
      header: '#',
      className: 'w-16',
      cell: (row) => <span className="font-mono text-sm text-muted-foreground">#{row.number}</span>,
    },
    {
      key: 'subject',
      header: 'Assunto',
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.subject}</p>
          <p className="text-xs text-muted-foreground">{row.category ?? 'Geral'}</p>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      cell: (row) => (
        <div>
          <p className="text-sm">{row.client?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{row.client?.email}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Prioridade',
      cell: (row) => (
        <Badge variant={PRIORITY_VARIANTS[row.priority] ?? 'outline'} className="text-xs">
          {TICKET_PRIORITY_LABELS[row.priority]}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status] ?? 'outline'} className="text-xs">
          {TICKET_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      key: 'messages',
      header: 'Msgs',
      className: 'w-16 text-center',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row._count?.messages ?? 0}</span>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Responsável',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.assignedTo?.name ?? '—'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Aberto em',
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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/support/${row.id}`) }}>
              Ver ticket
            </DropdownMenuItem>
            {row.status === 'OPEN' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatus(row.id, 'IN_PROGRESS') }}>
                Marcar em andamento
              </DropdownMenuItem>
            )}
            {!['RESOLVED', 'CLOSED'].includes(row.status) && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatus(row.id, 'RESOLVED') }}>
                Marcar resolvido
              </DropdownMenuItem>
            )}
            {row.status !== 'CLOSED' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatus(row.id, 'CLOSED') }}>
                Fechar ticket
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 font-semibold text-foreground">Suporte</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os chamados de suporte dos seus clientes.
          </p>
        </div>
      </div>

      {/* Summary */}
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
              <p className="text-2xl font-bold">{critical}</p>
              <p className="text-xs text-muted-foreground">Críticos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{resolved}</p>
              <p className="text-xs text-muted-foreground">Resolvidos</p>
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
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="OPEN">Aberto</SelectItem>
            <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
            <SelectItem value="WAITING_CLIENT">Aguardando cliente</SelectItem>
            <SelectItem value="RESOLVED">Resolvido</SelectItem>
            <SelectItem value="CLOSED">Fechado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => { setPriority(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="CRITICAL">Crítica</SelectItem>
            <SelectItem value="HIGH">Alta</SelectItem>
            <SelectItem value="MEDIUM">Média</SelectItem>
            <SelectItem value="LOW">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={fetch} title="Atualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <DataTable
          columns={columns}
          data={tickets}
          loading={loading}
          onRowClick={(row) => router.push(`/admin/support/${row.id}`)}
          emptyState={
            <EmptyState
              icon={HeadphonesIcon}
              title="Nenhum chamado encontrado"
              description="Os chamados de suporte dos seus clientes aparecerão aqui."
            />
          }
        />
        {meta.total > 0 && (
          <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
        )}
      </div>
    </div>
  )
}
