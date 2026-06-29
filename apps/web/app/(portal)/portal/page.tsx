'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/providers/auth-provider'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/api/orders'
import {
  Server, FileText, HeadphonesIcon, ArrowRight,
  CheckCircle2, AlertCircle, RefreshCcw, MessageSquare,
} from 'lucide-react'

interface PortalDashboard {
  client: { id: string; name: string; email: string }
  openInvoices: number
  openTickets: number
  activeOrders: number
  recentInvoices: Array<{
    id: string
    number: string
    status: string
    total: string
    dueDate: string
    paidAt?: string
  }>
}

interface PortalOrder {
  id: string
  billingCycle: string
  status: string
  total: string
  plan?: { name: string }
  subscription?: { status: string; nextBillingDate: string }
}

const CYCLE_PT: Record<string, string> = {
  MONTHLY: 'Mensal', QUARTERLY: 'Trimestral', SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual', BIANNUAL: 'Bianual', ONE_TIME: 'Único',
}

export default function PortalHomePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const firstName = user?.name?.split(' ')[0] || 'você'

  const [data, setData] = useState<PortalDashboard | null>(null)
  const [orders, setOrders] = useState<PortalOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [noProfile, setNoProfile] = useState(false)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/portal/dashboard'),
      api.get('/portal/orders'),
    ]).then(([dash, ord]) => {
      setData(dash.data?.data ?? dash.data)
      setOrders(ord.data?.data ?? ord.data ?? [])
    }).catch((e) => {
      if (e?.response?.status === 404) setNoProfile(true)
      else setFetchError(true)
    }).finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (noProfile) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-foreground">Perfil de cliente não encontrado</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sua conta de usuário ainda não está vinculada a um perfil de cliente. Entre em contato com o suporte.
        </p>
        <Button variant="outline" onClick={() => router.push('/portal/support/new')}>
          <HeadphonesIcon className="mr-2 h-4 w-4" /> Abrir chamado
        </Button>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-foreground">Não foi possível carregar o painel</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ocorreu um erro ao buscar seus dados. Tente recarregar a página.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Recarregar
        </Button>
      </div>
    )
  }

  const pendingInvoices = data?.recentInvoices.filter((i) => ['OPEN', 'OVERDUE'].includes(i.status)) ?? []
  const allOk = (data?.openInvoices ?? 0) === 0 && (data?.openTickets ?? 0) === 0
  const activeOrders = orders.filter((o) => o.status === 'ACTIVE')

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Greeting */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-h3 font-bold">
              {greeting}, {firstName}!
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {allOk
                ? 'Sua conta está em dia. Todos os seus serviços estão ativos.'
                : (data?.openInvoices ?? 0) > 0
                  ? `Você tem ${data!.openInvoices} fatura${data!.openInvoices !== 1 ? 's' : ''} em aberto.`
                  : `Você tem ${data!.openTickets} chamado${data!.openTickets !== 1 ? 's' : ''} de suporte em andamento.`}
            </p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${allOk ? 'bg-success/10' : 'bg-warning/10'}`}>
            {allOk
              ? <CheckCircle2 className="h-5 w-5 text-success" />
              : <AlertCircle className="h-5 w-5 text-warning" />}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Serviços ativos</p>
              <Server className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">{data?.activeOrders ?? 0}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {(data?.activeOrders ?? 0) === 1 ? 'serviço contratado' : 'serviços contratados'}
            </p>
          </CardContent>
        </Card>

        <Card className={(data?.openInvoices ?? 0) > 0 ? 'border-warning/40' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Faturas em aberto</p>
              <FileText className={`h-4 w-4 ${(data?.openInvoices ?? 0) > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${(data?.openInvoices ?? 0) > 0 ? 'text-warning' : ''}`}>
              {data?.openInvoices ?? 0}
            </p>
            <button
              onClick={() => router.push('/portal/invoices')}
              className="mt-0.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              {(data?.openInvoices ?? 0) > 0 ? 'Ver faturas →' : 'Ver histórico →'}
            </button>
          </CardContent>
        </Card>

        <Card className={(data?.openTickets ?? 0) > 0 ? 'border-primary/30' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Chamados abertos</p>
              <HeadphonesIcon className={`h-4 w-4 ${(data?.openTickets ?? 0) > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${(data?.openTickets ?? 0) > 0 ? 'text-primary' : ''}`}>
              {data?.openTickets ?? 0}
            </p>
            <button
              onClick={() => router.push('/portal/support')}
              className="mt-0.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              {(data?.openTickets ?? 0) > 0 ? 'Ver chamados →' : 'Abrir chamado →'}
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Services */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Meus serviços</h2>
            {activeOrders.length > 0 && (
              <button
                onClick={() => router.push('/portal/services')}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-10 text-center">
              <Server className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum serviço ativo.</p>
            </div>
          ) : (
            activeOrders.map((order) => (
              <Card key={order.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Server className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{order.plan?.name ?? 'Serviço'}</p>
                          <Badge variant="success" dot className="text-[10px]">Ativo</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {CYCLE_PT[order.billingCycle]} · {formatCurrency(order.total)}/ciclo
                        </p>
                        {order.subscription?.nextBillingDate && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Próxima cobrança: {new Date(order.subscription.nextBillingDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        <RefreshCcw className="mr-1 h-3 w-3" />
                        {CYCLE_PT[order.billingCycle]}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <button
            onClick={() => router.push('/portal/store')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            + Contratar novo serviço
          </button>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Invoices */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Faturas recentes</h2>
              <button
                onClick={() => router.push('/portal/invoices')}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Ver todas
              </button>
            </div>

            {pendingInvoices.length > 0 ? (
              pendingInvoices.map((invoice) => (
                <Card key={invoice.id} className={`mb-2 ${invoice.status === 'OVERDUE' ? 'border-danger/30 bg-danger/5' : 'border-warning/30 bg-warning/5'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium">{invoice.number}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {invoice.status === 'OVERDUE'
                            ? `Venceu ${new Date(invoice.dueDate).toLocaleDateString('pt-BR')}`
                            : `Vence ${new Date(invoice.dueDate).toLocaleDateString('pt-BR')}`}
                        </p>
                      </div>
                      <p className={`text-sm font-bold ${invoice.status === 'OVERDUE' ? 'text-danger' : 'text-warning'}`}>
                        {formatCurrency(invoice.total)}
                      </p>
                    </div>
                    <Button
                      className="mt-3 w-full"
                      size="sm"
                      variant={invoice.status === 'OVERDUE' ? 'destructive' : 'default'}
                      onClick={() => router.push('/portal/invoices')}
                    >
                      {invoice.status === 'OVERDUE' ? 'Regularizar agora' : 'Pagar agora'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <p className="text-sm text-muted-foreground">Nenhuma fatura em aberto.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick links */}
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Acesso rápido
              </p>
              {[
                { label: 'Abrir chamado de suporte', href: '/portal/support/new', icon: HeadphonesIcon },
                { label: 'Meus chamados', href: '/portal/support', icon: MessageSquare },
                { label: 'Ver todas as faturas', href: '/portal/invoices', icon: FileText },
              ].map((link) => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
