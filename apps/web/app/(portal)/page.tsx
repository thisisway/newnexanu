'use client'

import { useAuthStore } from '@/components/providers/auth-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Server,
  FileText,
  HeadphonesIcon,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'

const mockServices = [
  {
    id: '1',
    name: 'VPS-PRO-001',
    type: 'VPS',
    status: 'active',
    statusLabel: 'Ativo',
    detail: '4 vCPU • 8GB RAM • 100GB SSD',
    ip: '192.168.1.100',
  },
  {
    id: '2',
    name: 'meusite.com.br',
    type: 'WordPress',
    status: 'active',
    statusLabel: 'Ativo',
    detail: 'WordPress 6.4 • PHP 8.2',
    ip: null,
  },
]

const mockInvoices = [
  {
    id: '1',
    description: 'VPS-PRO-001 — Julho/2026',
    amount: 'R$ 149,90',
    dueDate: '25/07/2026',
    status: 'unpaid',
  },
]

export default function PortalHomePage() {
  const { user } = useAuthStore()
  const firstName = user?.name?.split(' ')[0] || 'você'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Greeting */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-h3 font-bold">
              {greeting}, {firstName}. 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sua conta está em dia. Todos os seus serviços estão ativos.
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Services */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Meus serviços</h2>
            <a href="/portal/services" className="text-xs text-muted-foreground hover:text-primary">
              Ver todos
            </a>
          </div>

          {mockServices.map((service) => (
            <Card key={service.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Server className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{service.name}</p>
                        <Badge variant="success" dot className="text-[10px]">
                          {service.statusLabel}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{service.detail}</p>
                      {service.ip && (
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {service.ip}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <a
            href="/portal/store"
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            + Contratar novo serviço
          </a>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Invoices */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Faturas em aberto</h2>
              <a href="/portal/invoices" className="text-xs text-muted-foreground hover:text-primary">
                Ver todas
              </a>
            </div>

            {mockInvoices.length > 0 ? (
              mockInvoices.map((invoice) => (
                <Card key={invoice.id} className="border-warning/30 bg-warning/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium">{invoice.description}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Vence em {invoice.dueDate}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-warning">{invoice.amount}</p>
                    </div>
                    <Button className="mt-3 w-full" size="sm">
                      Pagar agora
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
                { label: 'Ver minhas faturas', href: '/portal/invoices', icon: FileText },
                { label: 'Contratar serviço', href: '/portal/store', icon: Server },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
