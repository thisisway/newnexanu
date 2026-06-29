'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Code, Plus, Trash2, Copy, Check, ShieldOff, Key } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  status: 'ACTIVE' | 'REVOKED'
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

const SCOPE_LABELS: Record<string, string> = {
  'clients:read': 'Clientes — Leitura',
  'clients:write': 'Clientes — Escrita',
  'orders:read': 'Pedidos — Leitura',
  'orders:write': 'Pedidos — Escrita',
  'invoices:read': 'Faturas — Leitura',
  'invoices:write': 'Faturas — Escrita',
  'payments:read': 'Pagamentos — Leitura',
  'products:read': 'Produtos — Leitura',
  'subscriptions:read': 'Assinaturas — Leitura',
  'tickets:read': 'Suporte — Leitura',
  'tickets:write': 'Suporte — Escrita',
  'webhooks:read': 'Webhooks — Leitura',
  'webhooks:write': 'Webhooks — Escrita',
}

const SCOPE_GROUPS: Record<string, string[]> = {
  'Clientes': ['clients:read', 'clients:write'],
  'Pedidos': ['orders:read', 'orders:write'],
  'Faturas': ['invoices:read', 'invoices:write'],
  'Pagamentos': ['payments:read'],
  'Produtos': ['products:read'],
  'Assinaturas': ['subscriptions:read'],
  'Suporte': ['tickets:read', 'tickets:write'],
  'Webhooks': ['webhooks:read', 'webhooks:write'],
}

function NewKeyDialog({ open, onClose, onCreated }: {
  open: boolean
  onClose: () => void
  onCreated: (rawKey: string) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>([])
  const [expiresAt, setExpiresAt] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) { setName(''); setScopes([]); setExpiresAt('') }
  }, [open])

  function toggleScope(s: string) {
    setScopes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function toggleGroup(groupScopes: string[]) {
    const allSel = groupScopes.every((s) => scopes.includes(s))
    if (allSel) setScopes((prev) => prev.filter((s) => !groupScopes.includes(s)))
    else setScopes((prev) => Array.from(new Set([...prev, ...groupScopes])))
  }

  async function handleCreate() {
    if (!name.trim() || scopes.length === 0) {
      toast({ title: 'Informe o nome e selecione pelo menos um escopo', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await api.post('/admin/api-keys', { name: name.trim(), scopes, expiresAt: expiresAt || undefined })
      onCreated(res.data.rawKey)
      onClose()
    } catch {
      toast({ title: 'Erro ao criar chave', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Chave de API</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label>Nome da chave</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Integração ERP, App mobile..." />
          </div>
          <div className="grid gap-1.5">
            <Label>Expira em (opcional)</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Escopos de acesso</Label>
            {Object.entries(SCOPE_GROUPS).map(([group, groupScopes]) => {
              const allSel = groupScopes.every((s) => scopes.includes(s))
              return (
                <div key={group} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{group}</span>
                    <button onClick={() => toggleGroup(groupScopes)} className="text-xs text-primary hover:underline">
                      {allSel ? 'Desmarcar' : 'Marcar todos'}
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {groupScopes.map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggleScope(s)} className="rounded accent-primary" />
                        <span className="text-xs text-muted-foreground">{SCOPE_LABELS[s]}</span>
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
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Criando...' : 'Criar Chave'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RevealKeyDialog({ rawKey, onClose }: { rawKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(rawKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={!!rawKey} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chave criada — copie agora</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Esta é a única vez que você verá essa chave. Guarde-a em um local seguro.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs font-mono break-all select-all">
              {rawKey}
            </code>
            <Button size="icon" variant="outline" onClick={copy}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ApiPage() {
  const { toast } = useToast()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [rawKey, setRawKey] = useState('')
  const [revoking, setRevoking] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/api-keys')
      setKeys(res.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleRevoke(id: string, name: string) {
    if (!confirm(`Revogar a chave "${name}"? Integrações que usam esta chave pararão de funcionar imediatamente.`)) return
    setRevoking(id)
    try {
      await api.post(`/admin/api-keys/${id}/revoke`)
      setKeys((prev) => prev.map((k) => k.id === id ? { ...k, status: 'REVOKED' as const } : k))
      toast({ title: 'Chave revogada' })
    } catch {
      toast({ title: 'Erro ao revogar chave', variant: 'destructive' })
    } finally {
      setRevoking(null)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover a chave "${name}"? Esta ação não pode ser desfeita.`)) return
    try {
      await api.delete(`/admin/api-keys/${id}`)
      setKeys((prev) => prev.filter((k) => k.id !== id))
      toast({ title: 'Chave removida' })
    } catch {
      toast({ title: 'Erro ao remover chave', variant: 'destructive' })
    }
  }

  const active = keys.filter((k) => k.status === 'ACTIVE').length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 font-semibold text-foreground">Chaves de API</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie chaves de acesso para integrar sistemas externos ao Nexano.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Chave
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total', value: keys.length, icon: Key, color: 'bg-primary/10 text-primary' },
          { label: 'Ativas', value: active, icon: Check, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
          { label: 'Revogadas', value: keys.length - active, icon: ShieldOff, color: 'bg-muted text-muted-foreground' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Docs banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">Documentação da API</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Base URL: <code className="font-mono">{process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/v1</code>
            </p>
          </div>
          <Badge variant="outline" className="text-xs">Em breve</Badge>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : keys.length === 0 ? (
        <EmptyState
          icon={Code}
          title="Nenhuma chave criada"
          description="Crie uma chave de API para integrar aplicações externas."
          actions={[{ label: 'Nova Chave', onClick: () => setFormOpen(true) }]}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {keys.map((k) => (
            <Card key={k.id} className={k.status === 'REVOKED' ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${k.status === 'ACTIVE' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Key className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{k.name}</p>
                        <Badge variant={k.status === 'ACTIVE' ? 'success' : 'outline'} className="text-[10px]">
                          {k.status === 'ACTIVE' ? 'Ativa' : 'Revogada'}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs font-mono text-muted-foreground">{k.keyPrefix}••••••••••••••••••••</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span>Criada em {new Date(k.createdAt).toLocaleDateString('pt-BR')}</span>
                        {k.expiresAt && <span>Expira em {new Date(k.expiresAt).toLocaleDateString('pt-BR')}</span>}
                        {k.lastUsedAt && <span>Último uso: {new Date(k.lastUsedAt).toLocaleDateString('pt-BR')}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {k.scopes.map((s) => (
                          <span key={s} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {k.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={revoking === k.id}
                        onClick={() => handleRevoke(k.id, k.name)}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                        Revogar
                      </Button>
                    )}
                    {k.status === 'REVOKED' && (
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(k.id, k.name)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewKeyDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(key) => { setRawKey(key); load() }}
      />
      {rawKey && <RevealKeyDialog rawKey={rawKey} onClose={() => setRawKey('')} />}
    </div>
  )
}
