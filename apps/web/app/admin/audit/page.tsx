'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, Pagination, Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ShieldCheck, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId?: string
  userId?: string
  meta?: Record<string, unknown>
  createdAt: string
  user?: { id: string; name: string; email: string }
}

const ACTION_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'danger',
  LOGIN: 'default',
  LOGOUT: 'outline',
}

function MetaViewer({ meta }: { meta?: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)
  if (!meta || Object.keys(meta).length === 0) return <span className="text-muted-foreground text-xs">—</span>
  return (
    <div>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? 'Ocultar' : 'Ver detalhes'}
      </button>
      {open && (
        <pre className="mt-1 max-h-32 overflow-auto rounded-md bg-muted px-3 py-2 text-[10px] text-foreground">
          {JSON.stringify(meta, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const orgId = typeof window !== 'undefined' ? localStorage.getItem('nexano_org_id') : null

  const fetch = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    try {
      const res = await api.get('/admin/audit-logs', {
        params: {
          page,
          perPage: 20,
          ...(search ? { action: search } : {}),
        },
      })
      setLogs(res.data.data ?? [])
      const m = res.data.meta ?? {}
      setMeta({
        total: m.total ?? 0,
        page: m.page ?? 1,
        limit: m.perPage ?? 20,
        totalPages: m.totalPages ?? 1,
      })
    } finally {
      setLoading(false)
    }
  }, [orgId, page, search])

  useEffect(() => { fetch() }, [fetch])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const columns: Column<AuditLog>[] = [
    {
      key: 'action',
      header: 'Ação',
      className: 'w-28',
      cell: (row) => (
        <Badge variant={ACTION_VARIANTS[row.action] ?? 'outline'} className="font-mono text-[10px]">
          {row.action}
        </Badge>
      ),
    },
    {
      key: 'entity',
      header: 'Entidade',
      className: 'w-32',
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.entity}</p>
          {row.entityId && <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">{row.entityId}</p>}
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Usuário',
      cell: (row) => (
        <div>
          <p className="text-sm">{row.user?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{row.user?.email}</p>
        </div>
      ),
    },
    {
      key: 'meta',
      header: 'Detalhes',
      cell: (row) => <MetaViewer meta={row.meta} />,
    },
    {
      key: 'createdAt',
      header: 'Data/hora',
      className: 'w-40',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.createdAt).toLocaleString('pt-BR')}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 font-semibold text-foreground">Auditoria</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro de todas as ações realizadas na organização.
          </p>
        </div>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{meta.total}</p>
              <p className="text-xs text-muted-foreground">Eventos registrados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar ação, entidade ou usuário..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline">Buscar</Button>
        <Button type="button" variant="ghost" size="icon" onClick={fetch} title="Atualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </form>

      <div>
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyState={
            <EmptyState
              icon={ShieldCheck}
              title="Nenhum evento encontrado"
              description="Os eventos de auditoria da sua organização aparecerão aqui."
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
