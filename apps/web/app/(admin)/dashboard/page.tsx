import {
  Users,
  FileText,
  Server,
  HeadphonesIcon,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { MetricCard } from '@/components/ui/card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Dashboard',
}

const metrics = [
  {
    title: 'MRR',
    value: 'R$ 18.240',
    description: 'Receita mensal recorrente',
    icon: <TrendingUp />,
    trend: { value: 12.5, label: 'vs mês anterior' },
  },
  {
    title: 'Clientes ativos',
    value: '147',
    description: 'Total de clientes pagantes',
    icon: <Users />,
    trend: { value: 4.2, label: 'vs mês anterior' },
  },
  {
    title: 'Faturas em aberto',
    value: '23',
    description: 'Aguardando pagamento',
    icon: <FileText />,
    trend: { value: -2, label: 'vs semana passada' },
  },
  {
    title: 'Serviços ativos',
    value: '312',
    description: 'Em produção agora',
    icon: <Server />,
    trend: { value: 8.1, label: 'vs mês anterior' },
  },
]

const attentionItems = [
  {
    count: 3,
    label: 'VPS travadas no provisionamento',
    action: 'Ver jobs',
    href: '/admin/jobs',
    severity: 'error',
  },
  {
    count: 12,
    label: 'Faturas vencidas há mais de 5 dias',
    action: 'Enviar cobrança',
    href: '/admin/invoices?status=overdue',
    severity: 'warning',
  },
  {
    count: 2,
    label: 'Tickets críticos sem resposta',
    action: 'Atender agora',
    href: '/admin/support?priority=critical',
    severity: 'error',
  },
  {
    count: 4,
    label: 'Domínios vencem em 7 dias',
    action: 'Renovar',
    href: '/admin/domains?expiring=7',
    severity: 'warning',
  },
]

const recentActivity = [
  {
    id: '1',
    type: 'client',
    title: 'Novo cliente',
    description: 'Wesley Santos acabou de criar uma conta',
    time: '2 minutos atrás',
    status: 'active',
  },
  {
    id: '2',
    type: 'payment',
    title: 'Pagamento recebido',
    description: 'R$ 299,00 — Plano VPS Pro — Maria Lima',
    time: '15 minutos atrás',
    status: 'paid',
  },
  {
    id: '3',
    type: 'service',
    title: 'Serviço provisionado',
    description: 'VPS-001 criada com sucesso para Carlos Souza',
    time: '32 minutos atrás',
    status: 'active',
  },
  {
    id: '4',
    type: 'ticket',
    title: 'Ticket aberto',
    description: '#0041 — Problema com SSL — Ana Paula',
    time: '1 hora atrás',
    status: 'open',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-h2 font-bold">Visão Geral</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Acompanhe o desempenho da sua operação em tempo real.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Needs Attention */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <CardTitle>Precisa de atenção</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {attentionItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      item.severity === 'error'
                        ? 'bg-danger/10 text-danger'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {item.count}
                  </span>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
                <a
                  href={item.href}
                  className="shrink-0 text-[11px] font-medium text-primary hover:underline"
                >
                  {item.action}
                </a>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Atividade recente</CardTitle>
              <a href="/admin/audit" className="text-xs text-muted-foreground hover:text-primary">
                Ver tudo
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {recentActivity.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-4 py-3 ${
                    index < recentActivity.length - 1
                      ? 'border-b border-border'
                      : ''
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {item.type === 'client' && <Users className="h-4 w-4 text-muted-foreground" />}
                    {item.type === 'payment' && (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    {item.type === 'service' && (
                      <Server className="h-4 w-4 text-muted-foreground" />
                    )}
                    {item.type === 'ticket' && (
                      <HeadphonesIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <p className="shrink-0 text-[11px] text-muted-foreground">{item.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Ações rápidas:</span>
            <Button variant="outline" size="sm">Novo cliente</Button>
            <Button variant="outline" size="sm">Criar fatura</Button>
            <Button variant="outline" size="sm">Novo serviço</Button>
            <Button variant="outline" size="sm">Responder tickets</Button>
            <Button variant="outline" size="sm">Ver relatórios</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
