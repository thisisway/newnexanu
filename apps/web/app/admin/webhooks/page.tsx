'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  Webhook, Plus, Trash2, Edit2, Play,
  RefreshCw, AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WebhookItem {
  id: string
  name: string
  url: string
  events: string[]
  status: 'ACTIVE' | 'INACTIVE'
  lastTriggeredAt: string | null
  failCount: number
  _count?: { deliveries: number }
}

const EVENT_GROUPS: Record<string, string[]> = {
  'Pedidos': ['order.created', 'order.activated', 'order.cancelled'],
  'Faturas': ['invoice.created', 'invoice.paid', 'invoice.overdue'],
  'Assinaturas': ['subscription.renewed', 'subscription.suspended', 'subscription.cancelled'],
  'Clientes': ['client.created', 'client.updated'],
  'Pagamentos': ['payment.received', 'payment.failed'],
  'Suporte': ['ticket.created', 'ticket.closed'],
}

function WebhookFormDialog({
  open,
  onClose,
  onSaved,
  initial,
  allEvents,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initial?: WebhookItem | null
  allEvents: string[]
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setUrl(initial?.url ?? '')
      setSecret('')
      setEvents(initial?.events ?? [])
    }
  }, [open, initial])

  function toggleEvent(e: string) {
    setEvents((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])
  }

  function toggleGroup(groupEvents: string[]) {
    const allSelected = groupEvents.every((e) => events.includes(e))
    if (allSelected) {
      setEvents((prev) => prev.filter((e) => !groupEvents.includes(e)))
    } else {
      setEvents((prev) => Array.from(new Set([...prev, ...groupEvents])))
    }
  }

  async function handleSave() {
    if (!name.trim() || !url.trim() || events.length === 0) {
      toast({ title: 'Preencha nome, URL e selecione ao menos um evento', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = { name: name.trim(), url: url.trim(), events, ...(secret ? { secret } : {}) }
      if (initial) {
        await api.put(`/admin/webhooks/${initial.id}`, payload)
      } else {
        await api.post('/admin/webhooks', payload)
      }
      toast({ title: initial ? 'Webhook atualizado' : 'Webhook criado' })
      onSaved()
      onClose()
    } catch {
      toast({ title: 'Erro ao salvar webhook', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Meu sistema ERP" />
          </div>
          <div className="grid gap-1.5">
            <Label>URL do Endpoint</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://meusite.com/webhooks/nexano" />
          </div>
          <div className="grid gap-1.5">
            <Label>Secret (opcional)</Label>
            <Input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={initial ? '••••••• (deixe vazio para manter)' : 'Chave secreta para validação'}
              type="password"
            />
          </div>
          <div className="grid gap-2">
            <Label>Eventos</Label>
            {Object.entries(EVENT_GROUPS).map(([group, groupEvents]) => {
              const allSel = groupEvents.every((e) => events.includes(e))
              return (
                <div key={group} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{group}</span>
                    <button
                      onClick={() => toggleGroup(groupEvents)}
                      className="text-xs text-primary hover:underline"
                    >
                      {allSel ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {groupEvents.map((evt) => (
                      <label key={evt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={events.includes(evt)}
                          onChange={() => toggleEvent(evt)}
                          className="rounded accent-primary"
                        />
                        <span className="text-xs font-mono text-muted-foreground">{evt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
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

export default function WebhooksPage() {
  const { toast } = useToast()
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [allEvents, setAllEvents] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<WebhookItem | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/webhooks')
      setWebhooks(res.data.data ?? [])
      setAllEvents(res.data.events ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggleStatus(wh: WebhookItem) {
    const newStatus = wh.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await api.put(`/admin/webhooks/${wh.id}`, { status: newStatus })
      setWebhooks((prev) => prev.map((w) => w.id === wh.id ? { ...w, status: newStatus } : w))
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  async function handleTest(id: string) {
    setTesting(id)
    try {
      const res = await api.post(`/admin/webhooks/${id}/test`)
      const data = res.data
      if (data.success) {
        toast({ title: `Teste OK — HTTP ${data.statusCode}` })
      } else {
        toast({ title: `Teste falhou: ${data.error ?? `HTTP ${data.statusCode}`}`, variant: 'destructive' })
      }
      load()
    } catch {
      toast({ title: 'Erro ao testar webhook', variant: 'destructive' })
    } finally {
      setTesting(null)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await api.delete(`/admin/webhooks/${id}`)
      setWebhooks((prev) => prev.filter((w) => w.id !== id))
      toast({ title: 'Webhook removido' })
    } catch {
      toast({ title: 'Erro ao remover webhook', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  const active = webhooks.filter((w) => w.status === 'ACTIVE').length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 font-semibold text-foreground">Webhooks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Receba notificações em tempo real quando eventos ocorrem na plataforma.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Webhook
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total', value: webhooks.length, color: 'bg-primary/10 text-primary' },
          { label: 'Ativos', value: active, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
          { label: 'Inativos', value: webhooks.length - active, color: 'bg-muted text-muted-foreground' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                <Webhook className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : webhooks.length === 0 ? (
        <EmptyState
          icon={Webhook}
          title="Nenhum webhook configurado"
          description="Crie um webhook para receber notificações de eventos em seus sistemas externos."
          actions={[{ label: 'Novo Webhook', onClick: () => { setEditing(null); setFormOpen(true) } }]}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {webhooks.map((wh) => (
            <Card key={wh.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${wh.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                      <Webhook className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{wh.name}</p>
                        {wh.failCount > 0 && (
                          <Badge variant="danger" className="text-[10px]">
                            <AlertTriangle className="mr-1 h-2.5 w-2.5" />
                            {wh.failCount} falhas
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{wh.url}</p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {wh.events.slice(0, 5).map((evt) => (
                          <span key={evt} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                            {evt}
                          </span>
                        ))}
                        {wh.events.length > 5 && (
                          <span className="text-[10px] text-muted-foreground">+{wh.events.length - 5}</span>
                        )}
                      </div>
                      {wh.lastTriggeredAt && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Último disparo: {new Date(wh.lastTriggeredAt).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      checked={wh.status === 'ACTIVE'}
                      onCheckedChange={() => handleToggleStatus(wh)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Testar"
                      disabled={testing === wh.id}
                      onClick={() => handleTest(wh.id)}
                    >
                      {testing === wh.id
                        ? <RefreshCw className="h-4 w-4 animate-spin" />
                        : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" title="Editar" onClick={() => { setEditing(wh); setFormOpen(true) }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Remover"
                      disabled={deleting === wh.id}
                      onClick={() => handleDelete(wh.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WebhookFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        initial={editing}
        allEvents={allEvents}
      />
    </div>
  )
}
