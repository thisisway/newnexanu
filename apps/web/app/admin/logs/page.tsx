'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, Pagination, Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { ScrollText, RefreshCw, Search, AlertTriangle, Info, ShieldAlert } from 'lucide-react'

interface LogEntry {
  id: string
  action: string
  entity: string | null
  entityId: string | null
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  ip: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  user: { name: string; email: string } | null
}

const SEVERITY_CONFIG = {
  INFO: { label: 'Info', variant: 'default' as const, icon: Info, color: 'text-blue-600' },
  WARNING: { label: 'Aviso', variant: 'warning' as const, icon: AlertTriangle, color: 'text-amber-600' },
  CRITICAL: { label: 'Crítico', variant: 'danger' as const, icon: ShieldAlert, color: 'text-red-600' },
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [severity, setSeverity] = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/audit-logs', {
        params: {
          page,
          perPage: 20,
          ...(search ? { action: search } : {}),
          ...(severity ? { severity } : {}),
        },
      })
      const raw = res.data.data ?? []
      setLogs(raw)
      const m = res.data.meta ?? {}
      setMeta({
        total: m.total ?? 0,
        page: m.page ?? 1,
        perPage: m.perPage ?? 20,
        totalPages: m.totalPages ?? 1,
      })
    } finally {
      setLoading(false)
    }
  }, [page, search, severity])

  useEffect(() => { load() }, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const counts = {
    total: meta.total,
    warning: logs.filter((l) => l.severity === 'WARNING').length,
    critical: logs.filter((l) => l.severity === 'CRITICAL').length,
  }

  const columns: Column<LogEntry>[] = [
    {
      key: 'severity',
      header: 'Nível',
      className: 'w-28',
      cell: (row) => {
        const cfg = SEVERITY_CONFIG[row.severity]
        const Icon = cfg.icon
        return (
          <Badge variant={cfg.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        )
      },
    },
    {
      key: 'action',
      header: 'Evento',
      cell: (row) => (
        <div>
          <p className="text-sm font-medium font-mono">{row.action}</p>
          {row.entity && (
            <p className="text-xs text-muted-foreground">
              {row.entity}{row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ''}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Usuário / IP',
      cell: (row) => (
        <div>
          <p className="text-sm">{row.user?.name ?? 'Sistema'}</p>
          {row.ip && <p className="text-xs text-muted-foreground font-mono">{row.ip}</p>}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Data/Hora',
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
          <h1 className="text-h2 font-semibold text-foreground">Logs do Sistema</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Eventos de sistema, erros e ações administrativas registradas.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={load}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Eventos totais', value: counts.total, color: 'bg-primary/10 text-primary' },
          { label: 'Avisos', value: counts.warning, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
          { label: 'Críticos', value: counts.critical, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                <ScrollText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar evento..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <Button type="submit" variant="outline">Buscar</Button>
        </form>
        <div className="flex items-center gap-1.5">
          {(['', 'INFO', 'WARNING', 'CRITICAL'] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={severity === s ? 'default' : 'outline'}
              onClick={() => { setSeverity(s); setPage(1) }}
            >
              {s || 'Todos'}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyState={
            <EmptyState
              icon={ScrollText}
              title="Nenhum log encontrado"
              description="Os eventos do sistema aparecerão aqui conforme a plataforma é utilizada."
            />
          }
        />
        {meta.total > 0 && (
          <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} />
        )}
      </div>
    </div>
  )
}
