'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Server, RefreshCw, Eye, Pause, Play, XCircle, Search, SlidersHorizontal,
} from 'lucide-react'
import { api } from '@/lib/api'
import { CYCLE_LABELS, formatCurrency } from '@/lib/api/orders'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable, Pagination, Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

interface Service {
  id: string
  status: string
  billingCycle: string
  total: string
  activatedAt?: string
  createdAt: string
  client?: { id: string; name: string; email: string }
  plan?: { id: string; name: string; product?: { id: string; name: string } }
  subscription?: { nextBillingDate?: string; status?: string }
  _count?: { invoices: number }
}

interface Stats {
  active: number
  suspended: number
  cancelled: number
  total: number
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  CANCELLED: 'danger',
}
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo', SUSPENDED: 'Suspenso', CANCELLED: 'Cancelado',
}

export default function ServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      const [res, statsRes] = await Promise.all([
        api.get(`/admin/services?${params}`),
        stats === null ? api.get('/admin/services/stats') : Promise.resolve(null),
      ])
      setServices(res.data.data ?? [])
      setMeta({ total: res.data.total, page: res.data.page, limit: res.data.limit, totalPages: res.data.totalPages })
      if (statsRes) setStats(statsRes.data?.data ?? statsRes.data)
    } catch { /* noop */ }
    finally { setLoading(false) }
  }, [page, status, search])

  useEffect(() => { load() }, [load])

  async function handleAction(svcId: string, action: 'suspend' | 'reactivate' | 'cancel') {
    const messages = {
      suspend: 'Suspender este serviço?',
      reactivate: 'Reativar este serviço?',
      cancel: 'Cancelar este serviço? Esta ação não pode ser desfeita.',
    }
    if (!confirm(messages[action])) return
    setActing(svcId)
    try {
      await api.post(`/admin/services/${svcId}/${action}`)
      await load()
      const statsRes = await api.get('/admin/services/stats')
      setStats(statsRes.data?.data ?? statsRes.data)
    } catch { /* noop */ }
    finally { setActing(null) }
  }

  const columns: Column<Service>[] = [
    {
      key: 'client',
      header: 'Cliente',
      cell: (s) => (
        <div>
          <p className="font-medium text-foreground text-sm">{s.client?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{s.client?.email}</p>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plano / Produto',
      cell: (s) => (
        <div>
          <p className="text-sm font-medium">{s.plan?.name ?? '—'}</p>
          {s.plan?.product?.name && (
            <p className="text-xs text-muted-foreground">{s.plan.product.name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => (
        <Badge variant={STATUS_VARIANTS[s.status] ?? 'outline'} dot>
          {STATUS_LABELS[s.status] ?? s.status}
        </Badge>
      ),
    },
    {
      key: 'billing',
      header: 'Ciclo / Valor',
      cell: (s) => (
        <div>
          <p className="text-sm font-semibold">{formatCurrency(s.total)}</p>
          <p className="text-xs text-muted-foreground">
            {(CYCLE_LABELS as Record<string, string>)[s.billingCycle] ?? s.billingCycle}
          </p>
        </div>
      ),
    },
    {
      key: 'nextBilling',
      header: 'Próx. renovação',
      cell: (s) => s.subscription?.nextBillingDate
        ? (
          <p className="text-sm text-muted-foreground">
            {new Date(s.subscription.nextBillingDate).toLocaleDateString('pt-BR')}
          </p>
        )
        : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: 'since',
      header: 'Desde',
      cell: (s) => (
        <p className="text-xs text-muted-foreground">
          {new Date(s.activatedAt ?? s.createdAt).toLocaleDateString('pt-BR')}
        </p>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (s) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-lg"
            onClick={() => router.push(`/admin/services/${s.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="rounded-lg" disabled={acting === s.id}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              {s.status === 'ACTIVE' && (
                <DropdownMenuItem onClick={() => handleAction(s.id, 'suspend')} className="rounded-lg mx-1">
                  <Pause className="mr-2 h-3.5 w-3.5" /> Suspender
                </DropdownMenuItem>
              )}
              {s.status === 'SUSPENDED' && (
                <DropdownMenuItem onClick={() => handleAction(s.id, 'reactivate')} className="rounded-lg mx-1">
                  <Play className="mr-2 h-3.5 w-3.5" /> Reativar
                </DropdownMenuItem>
              )}
              {s.status !== 'CANCELLED' && (
                <DropdownMenuItem
                  destructive
                  onClick={() => handleAction(s.id, 'cancel')}
                  className="rounded-lg mx-1"
                >
                  <XCircle className="mr-2 h-3.5 w-3.5" /> Cancelar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h2 font-bold font-heading">Serviços</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Serviços contratados e provisionados por seus clientes.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))
        ) : (
          [
            { label: 'Total', value: stats?.total ?? 0, color: 'text-foreground' },
            { label: 'Ativos', value: stats?.active ?? 0, color: 'text-success' },
            { label: 'Suspensos', value: stats?.suspended ?? 0, color: 'text-warning' },
            { label: 'Cancelados', value: stats?.cancelled ?? 0, color: 'text-danger' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold font-heading ${s.color}`}>{s.value}</p>
                </div>
                <Server className="h-8 w-8 text-muted-foreground/20" />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                leftIcon={<Search />}
                placeholder="Buscar por cliente ou plano…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1) } }}
                className="h-9"
              />
            </div>
            <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-44 h-9 rounded-xl">
                <SlidersHorizontal className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ACTIVE">Ativos</SelectItem>
                <SelectItem value="SUSPENDED">Suspensos</SelectItem>
                <SelectItem value="CANCELLED">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => { setSearch(searchInput); setPage(1); load() }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={Server}
          title="Nenhum serviço encontrado"
          description="Os serviços aparecem aqui após a ativação de pedidos."
        />
      ) : (
        <>
          <DataTable data={services} columns={columns} onRowClick={(s) => router.push(`/admin/services/${s.id}`)} />
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
