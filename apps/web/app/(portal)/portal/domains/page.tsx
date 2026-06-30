'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Globe, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Domain {
  id: string
  name: string
  status: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON' | 'PENDING_TRANSFER' | 'SUSPENDED'
  registrar: string | null
  expiresAt: string | null
  autoRenew: boolean
}

const STATUS_CONFIG = {
  ACTIVE: { label: 'Ativo', variant: 'success' as const, icon: CheckCircle },
  EXPIRED: { label: 'Expirado', variant: 'danger' as const, icon: XCircle },
  EXPIRING_SOON: { label: 'Expirando em breve', variant: 'warning' as const, icon: AlertTriangle },
  PENDING_TRANSFER: { label: 'Em Transferência', variant: 'default' as const, icon: Clock },
  SUSPENDED: { label: 'Suspenso', variant: 'outline' as const, icon: XCircle },
}

function daysUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function PortalDomainsPage() {
  const { data: domains = [], isLoading: loading, isError: error } = useQuery({
    queryKey: ['portal', 'domains'],
    queryFn: async (): Promise<Domain[]> => {
      const r = await api.get('/portal/domains')
      return r.data?.data ?? r.data ?? []
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 font-bold text-foreground">Meus Domínios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Domínios registrados na sua conta.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : error || domains.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="Nenhum domínio encontrado"
          description="Você não possui domínios registrados nesta conta. Entre em contato com o suporte se precisar registrar ou transferir um domínio."
          actions={[{ label: 'Abrir chamado', onClick: () => window.location.href = '/portal/support/new' }]}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {domains.map((domain) => {
            const cfg = STATUS_CONFIG[domain.status]
            const Icon = cfg.icon
            const days = domain.expiresAt ? daysUntil(domain.expiresAt) : null
            const urgentExpiry = days !== null && days <= 30 && days > 0

            return (
              <Card key={domain.id} className={urgentExpiry ? 'border-amber-300 dark:border-amber-700' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        domain.status === 'ACTIVE' ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Globe className={`h-4 w-4 ${domain.status === 'ACTIVE' ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold font-mono truncate">{domain.name}</p>
                        {domain.registrar && (
                          <p className="text-xs text-muted-foreground mt-0.5">{domain.registrar}</p>
                        )}
                        {domain.expiresAt && (
                          <p className={`mt-1 text-xs ${urgentExpiry ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                            {domain.status === 'EXPIRED'
                              ? `Expirou em ${new Date(domain.expiresAt).toLocaleDateString('pt-BR')}`
                              : days !== null && days > 0
                                ? `Expira em ${days} dia${days !== 1 ? 's' : ''}`
                                : `Expira em ${new Date(domain.expiresAt).toLocaleDateString('pt-BR')}`
                            }
                          </p>
                        )}
                        {domain.autoRenew && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground">Renovação automática ativada</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant={cfg.variant} className="gap-1 text-[10px]">
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                  {urgentExpiry && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Domínio expira em breve. Entre em contato com o suporte para renovar.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
