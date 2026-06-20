'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { portalTicketsApi, Ticket, TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/lib/api/tickets'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { HeadphonesIcon, Plus, MessageSquare } from 'lucide-react'

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  OPEN: 'warning', IN_PROGRESS: 'default', WAITING_CLIENT: 'outline', RESOLVED: 'success', CLOSED: 'outline',
}

export default function PortalSupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portalTicketsApi.list()
      .then((data) => setTickets(Array.isArray(data) ? data : data.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 font-bold text-foreground">Suporte</h1>
          <p className="mt-1 text-sm text-muted-foreground">Seus chamados de suporte.</p>
        </div>
        <Button onClick={() => router.push('/portal/support/new')}>
          <Plus className="mr-2 h-4 w-4" /> Novo chamado
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={HeadphonesIcon}
          title="Nenhum chamado aberto"
          description="Precisando de ajuda? Abra um chamado e nossa equipe irá atendê-lo."
          actions={[{ label: 'Abrir chamado', onClick: () => router.push('/portal/support/new') }]}
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer transition-colors hover:border-primary/40"
              onClick={() => router.push(`/portal/support/${ticket.id}`)}
            >
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <HeadphonesIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{ticket.subject}</p>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">#{ticket.number}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      {ticket._count && ` · ${ticket._count.messages} mensagem${ticket._count.messages !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_VARIANTS[ticket.status] ?? 'outline'} className="text-xs">
                    {TICKET_STATUS_LABELS[ticket.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
