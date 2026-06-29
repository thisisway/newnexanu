'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { portalTicketsApi, Ticket, TICKET_STATUS_LABELS } from '@/lib/api/tickets'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Send, X } from 'lucide-react'

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'outline'> = {
  OPEN: 'warning', IN_PROGRESS: 'default', WAITING_CLIENT: 'outline', RESOLVED: 'success', CLOSED: 'outline',
}

export default function PortalTicketDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const data = await portalTicketsApi.get(id)
    setTicket(data.data ?? data)
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  async function handleSend() {
    if (!reply.trim()) return
    setSending(true)
    try {
      await portalTicketsApi.addMessage(id, reply)
      setReply('')
      await load()
    } finally { setSending(false) }
  }

  async function handleClose() {
    setClosing(true)
    try {
      await portalTicketsApi.close(id)
      await load()
    } finally { setClosing(false) }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  if (!ticket) return null

  const isClosed = ['CLOSED', 'RESOLVED'].includes(ticket.status)

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-h2 font-semibold">#{ticket.number} — {ticket.subject}</h1>
              <Badge variant={STATUS_VARIANTS[ticket.status] ?? 'outline'}>
                {TICKET_STATUS_LABELS[ticket.status]}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Aberto em {new Date(ticket.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
        {!isClosed && (
          <Button variant="outline" size="sm" onClick={handleClose} loading={closing}>
            <X className="mr-2 h-3.5 w-3.5" /> Fechar chamado
          </Button>
        )}
      </div>

      {/* Conversation */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
            {ticket.messages?.filter((m) => !m.isInternal).map((msg) => {
              const isStaff = !!msg.user
              const name = msg.user?.name ?? msg.client?.name ?? 'Você'
              const initial = name.charAt(0).toUpperCase()
              return (
                <div key={msg.id} className={`flex gap-3 ${isStaff ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={`text-xs ${isStaff ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[70%] flex flex-col gap-1 ${isStaff ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{isStaff ? name : 'Você'}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className={`rounded-xl px-4 py-2.5 text-sm ${
                      isStaff ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    }`}>
                      {msg.body}
                    </div>
                  </div>
                </div>
              )
            })}
            {(!ticket.messages || ticket.messages.filter((m) => !m.isInternal).length === 0) && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
            )}
            <div ref={bottomRef} />
          </div>

          {!isClosed && (
            <div className="border-t border-border pt-4">
              <Textarea
                placeholder="Escrever resposta..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <Button onClick={handleSend} loading={sending} disabled={!reply.trim()}>
                  <Send className="mr-2 h-4 w-4" /> Enviar resposta
                </Button>
              </div>
            </div>
          )}

          {isClosed && (
            <p className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
              Este chamado está encerrado. Abra um novo chamado se precisar de mais ajuda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
