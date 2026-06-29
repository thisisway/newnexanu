'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DataTable, Pagination, Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Globe, Plus, Search, RefreshCw, Trash2, Edit2,
  AlertTriangle, CheckCircle, XCircle, Clock,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Domain {
  id: string
  name: string
  status: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON' | 'PENDING_TRANSFER' | 'SUSPENDED'
  registrar: string | null
  expiresAt: string | null
  autoRenew: boolean
  notes: string | null
  clientId: string | null
  client: { id: string; name: string; email: string } | null
  createdAt: string
}

interface Stats {
  total: number
  active: number
  expired: number
  expiringSoon: number
}

const STATUS_CONFIG = {
  ACTIVE: { label: 'Ativo', variant: 'success' as const, icon: CheckCircle },
  EXPIRED: { label: 'Expirado', variant: 'danger' as const, icon: XCircle },
  EXPIRING_SOON: { label: 'Expirando', variant: 'warning' as const, icon: AlertTriangle },
  PENDING_TRANSFER: { label: 'Em Transferência', variant: 'default' as const, icon: Clock },
  SUSPENDED: { label: 'Suspenso', variant: 'outline' as const, icon: XCircle },
}

function DomainFormDialog({ open, onClose, onSaved, initial }: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initial?: Domain | null
}) {
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', registrar: '', expiresAt: '', autoRenew: true, notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? '',
        registrar: initial?.registrar ?? '',
        expiresAt: initial?.expiresAt ? initial.expiresAt.split('T')[0] : '',
        autoRenew: initial?.autoRenew ?? true,
        notes: initial?.notes ?? '',
      })
    }
  }, [open, initial])

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast({ title: 'Informe o nome do domínio', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        registrar: form.registrar || undefined,
        expiresAt: form.expiresAt || undefined,
        autoRenew: form.autoRenew,
        notes: form.notes || undefined,
      }
      if (initial) {
        await api.put(`/admin/domains/${initial.id}`, payload)
        toast({ title: 'Domínio atualizado' })
      } else {
        await api.post('/admin/domains', payload)
        toast({ title: 'Domínio adicionado' })
      }
      onSaved()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast({ title: msg ?? 'Erro ao salvar domínio', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar Domínio' : 'Adicionar Domínio'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label>Domínio</Label>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="exemplo.com.br"
              disabled={!!initial}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Registrar</Label>
            <Input value={form.registrar} onChange={(e) => set('registrar', e.target.value)} placeholder="Registro.br, GoDaddy..." />
          </div>
          <div className="grid gap-1.5">
            <Label>Data de expiração</Label>
            <Input type="date" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Renovação automática</Label>
            <Switch checked={form.autoRenew} onCheckedChange={(v) => set('autoRenew', v)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Observações</Label>
            <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Notas internas..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function DomainsPage() {
  const { toast } = useToast()
  const [domains, setDomains] = useState<Domain[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expired: 0, expiringSoon: 0 })
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Domain | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [domainsRes, statsRes] = await Promise.all([
        api.get('/admin/domains', { params: { page, perPage: 20, search: search || undefined } }),
        api.get('/admin/domains/stats'),
      ])
      setDomains(domainsRes.data.data ?? [])
      setMeta(domainsRes.data.meta ?? meta)
      setStats(statsRes.data?.data ?? statsRes.data ?? stats)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover o domínio "${name}"? Esta ação não pode ser desfeita.`)) return
    try {
      await api.delete(`/admin/domains/${id}`)
      toast({ title: 'Domínio removido' })
      load()
    } catch {
      toast({ title: 'Erro ao remover domínio', variant: 'destructive' })
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const columns: Column<Domain>[] = [
    {
      key: 'name',
      header: 'Domínio',
      cell: (row) => (
        <div>
          <p className="font-medium text-sm font-mono">{row.name}</p>
          {row.registrar && <p className="text-xs text-muted-foreground">{row.registrar}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-36',
      cell: (row) => {
        const cfg = STATUS_CONFIG[row.status]
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>
      },
    },
    {
      key: 'client',
      header: 'Cliente',
      cell: (row) => row.client
        ? <div><p className="text-sm">{row.client.name}</p><p className="text-xs text-muted-foreground">{row.client.email}</p></div>
        : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: 'expiresAt',
      header: 'Expira em',
      className: 'w-32',
      cell: (row) => row.expiresAt
        ? (
          <div>
            <p className="text-sm">{new Date(row.expiresAt).toLocaleDateString('pt-BR')}</p>
            {row.autoRenew && <p className="text-[10px] text-muted-foreground">Auto-renovação</p>}
          </div>
        )
        : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: 'actions' as keyof Domain,
      header: '',
      className: 'w-20',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => { setEditing(row); setFormOpen(true) }}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(row.id, row.name)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 font-semibold text-foreground">Domínios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie e monitore os domínios dos seus clientes.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Domínio
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-primary/10 text-primary' },
          { label: 'Ativos', value: stats.active, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
          { label: 'Expirando (30d)', value: stats.expiringSoon, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
          { label: 'Expirados', value: stats.expired, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar domínio..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <Button type="submit" variant="outline">Buscar</Button>
        <Button type="button" variant="ghost" size="icon" onClick={load}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </form>

      <div>
        <DataTable
          columns={columns}
          data={domains}
          loading={loading}
          emptyState={
            <EmptyState
              icon={Globe}
              title="Nenhum domínio cadastrado"
              description="Adicione os domínios dos seus clientes para monitorar expiração e renovação."
              actions={[{ label: 'Adicionar Domínio', onClick: () => { setEditing(null); setFormOpen(true) } }]}
            />
          }
        />
        {meta.total > 0 && (
          <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} />
        )}
      </div>

      <DomainFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        initial={editing}
      />
    </div>
  )
}
