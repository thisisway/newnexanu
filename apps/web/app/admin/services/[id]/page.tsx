'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Server, User, CreditCard, FileText, Calendar,
  Pause, Play, XCircle, RefreshCw, Save,
} from 'lucide-react'
import { api } from '@/lib/api'
import { CYCLE_LABELS, INVOICE_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS, formatCurrency } from '@/lib/api/orders'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

interface Service {
  id: string
  status: string
  billingCycle: string
  total: string
  notes?: string
  activatedAt?: string
  cancelledAt?: string
  createdAt: string
  client?: { id: string; name: string; email: string; phone?: string }
  plan?: { id: string; name: string; product?: { id: string; name: string } }
  subscription?: { id: string; status?: string; nextBillingDate?: string; currentPeriodEnd?: string; cancelAtPeriodEnd?: boolean }
  invoices?: Array<{ id: string; number: string; status: string; total: string; dueDate: string; createdAt: string }>
  _count?: { invoices: number }
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  ACTIVE: 'success', SUSPENDED: 'warning', CANCELLED: 'danger',
}
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo', SUSPENDED: 'Suspenso', CANCELLED: 'Cancelado',
}
const INV_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  OPEN: 'warning', PAID: 'success', OVERDUE: 'danger', CANCELLED: 'outline', DRAFT: 'outline',
}

export default function ServiceDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [svc, setSvc] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [notes, setNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  async function refresh() {
    const res = await api.get(`/admin/services/${id}`)
    setSvc(res.data)
    setNotes(res.data.notes ?? '')
  }

  useEffect(() => { refresh().finally(() => setLoading(false)) }, [id])

  async function handleAction(action: 'suspend' | 'reactivate' | 'cancel') {
    const messages = {
      suspend: 'Suspender este serviço?',
      reactivate: 'Reativar este serviço?',
      cancel: 'Cancelar este serviço? Esta ação não pode ser desfeita.',
    }
    if (!confirm(messages[action])) return
    setActing(true)
    try { await api.post(`/admin/services/${id}/${action}`); await refresh() }
    finally { setActing(false) }
  }

  async function saveNotes() {
    setNotesSaving(true)
    try {
      await api.patch(`/admin/services/${id}/notes`, { notes })
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    } finally { setNotesSaving(false) }
  }

  if (loading) return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-64 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  )

  if (!svc) return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <p className="text-sm text-muted-foreground">Serviço não encontrado.</p>
      <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-h2 font-bold font-heading">{svc.plan?.name ?? 'Serviço'}</h1>
              <Badge variant={STATUS_VARIANTS[svc.status] ?? 'outline'} dot>
                {STATUS_LABELS[svc.status] ?? svc.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {svc.plan?.product?.name} · #{svc.id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {svc.status === 'ACTIVE' && (
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleAction('suspend')} disabled={acting}>
              <Pause className="mr-2 h-3.5 w-3.5" /> Suspender
            </Button>
          )}
          {svc.status === 'SUSPENDED' && (
            <Button size="sm" className="rounded-xl" onClick={() => handleAction('reactivate')} disabled={acting}>
              <Play className="mr-2 h-3.5 w-3.5" /> Reativar
            </Button>
          )}
          {svc.status !== 'CANCELLED' && (
            <Button variant="outline" size="sm" className="rounded-xl text-danger border-danger/30 hover:bg-danger/5" onClick={() => handleAction('cancel')} disabled={acting}>
              <XCircle className="mr-2 h-3.5 w-3.5" /> Cancelar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Plan / Billing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Server className="h-4 w-4 text-primary" /> Informações do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Plano" value={svc.plan?.name ?? '—'} />
                <InfoRow label="Produto" value={svc.plan?.product?.name ?? '—'} />
                <InfoRow label="Ciclo de cobrança" value={(CYCLE_LABELS as Record<string, string>)[svc.billingCycle] ?? svc.billingCycle} />
                <InfoRow label="Valor" value={formatCurrency(svc.total)} />
                <InfoRow label="Ativado em" value={svc.activatedAt ? new Date(svc.activatedAt).toLocaleDateString('pt-BR') : '—'} />
                {svc.cancelledAt && (
                  <InfoRow label="Cancelado em" value={new Date(svc.cancelledAt).toLocaleDateString('pt-BR')} />
                )}
                {svc.subscription?.nextBillingDate && (
                  <InfoRow
                    label="Próxima renovação"
                    value={new Date(svc.subscription.nextBillingDate).toLocaleDateString('pt-BR')}
                    highlight
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" /> Notas internas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Adicione notas sobre este serviço (credenciais, configurações, observações)…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="rounded-xl resize-none text-sm"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" className="rounded-xl" onClick={saveNotes} loading={notesSaving}>
                  <Save className="mr-2 h-3.5 w-3.5" /> Salvar notas
                </Button>
                {notesSaved && <span className="text-xs text-success">✓ Salvo!</span>}
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          {svc.invoices && svc.invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" /> Faturas recentes
                  </span>
                  <button
                    onClick={() => router.push(`/admin/invoices?clientId=${svc.client?.id}`)}
                    className="text-xs text-primary hover:underline font-normal"
                  >
                    Ver todas ({svc._count?.invoices ?? 0})
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {svc.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => router.push(`/admin/invoices/${inv.id}`)}
                      className="flex cursor-pointer items-center justify-between gap-4 py-2.5 hover:bg-muted/30 -mx-1 px-1 rounded-xl transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">{inv.number}</p>
                        <p className="text-xs text-muted-foreground">
                          Vence {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={INV_VARIANTS[inv.status] ?? 'outline'} className="text-xs">
                          {(INVOICE_STATUS_LABELS as Record<string, string>)[inv.status] ?? inv.status}
                        </Badge>
                        <p className="text-sm font-semibold">{formatCurrency(inv.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-primary" /> Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-foreground">{svc.client?.name}</p>
                <p className="text-sm text-muted-foreground">{svc.client?.email}</p>
                {svc.client?.phone && (
                  <p className="text-sm text-muted-foreground">{svc.client.phone}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl"
                onClick={() => router.push(`/admin/clients/${svc.client?.id}`)}
              >
                Ver perfil do cliente
              </Button>
            </CardContent>
          </Card>

          {/* Subscription */}
          {svc.subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 text-primary" /> Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Status" value={(SUBSCRIPTION_STATUS_LABELS as Record<string, string>)[svc.subscription.status ?? ''] ?? svc.subscription.status ?? '—'} />
                {svc.subscription.nextBillingDate && (
                  <InfoRow
                    label="Próx. cobrança"
                    value={new Date(svc.subscription.nextBillingDate).toLocaleDateString('pt-BR')}
                  />
                )}
                {svc.subscription.currentPeriodEnd && (
                  <InfoRow
                    label="Fim do período"
                    value={new Date(svc.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                  />
                )}
                {svc.subscription.cancelAtPeriodEnd && (
                  <p className="text-xs text-warning font-medium mt-1">
                    ⚠ Cancela no fim do período
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl mt-2"
                  onClick={() => router.push(`/admin/subscriptions`)}
                >
                  <Calendar className="mr-2 h-3.5 w-3.5" /> Ver assinaturas
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}
