'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Send, Lock, User, Server, FileText,
  HeadphonesIcon, ExternalLink, AlertCircle,
} from 'lucide-react'
import { ticketsApi, Ticket, TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/lib/api/tickets'
import { ordersApi, invoicesApi, Order, Invoice, formatCurrency, INVOICE_STATUS_LABELS } from '@/lib/api/orders'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  OPEN: 'warning', IN_PROGRESS: 'default', WAITING_CLIENT: 'outline', RESOLVED: 'success', CLOSED: 'outline',
}
const PRIORITY_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  LOW: 'outline', MEDIUM: 'default', HIGH: 'warning', CRITICAL: 'danger',
}
const INVOICE_STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  OPEN: 'warning', OVERDUE: 'danger', PAID: 'success', DRAFT: 'outline', CANCELLED: 'outline',
}

export default function TicketDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Client context
  const [clientOrders, setClientOrders] = useState<Order[]>([])
  const [clientInvoices, setClientInvoices] = useState<Invoice[]>([])
  const [clientTickets, setClientTickets] = useState<Ticket[]>([])

  async function load() {
    const data = await ticketsApi.get(id)
    const t = data.data ?? data
    setTicket(t)
    return t
  }

  useEffect(() => {
    load()
      .then(async (t) => {
        if (!t.client?.id) return
        const clientId = t.client.id
        const [ord, inv, tix] = await Promise.all([
          ordersApi.list({ clientId, limit: 5 }),
          invoicesApi.list({ clientId, limit: 5 }),
          ticketsApi.list({ clientId, limit: 6 }),
        ])
        setClientOrders(ord.data ?? ord)
        setClientInvoices(inv.data ?? inv)
        const allTix: Ticket[] = tix.data ?? tix
        setClientTickets(allTix.filter((tk) => tk.id !== id))
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  async function handleSend() {
    if (!reply.trim()) return
    setSending(true)
    try {
      await ticketsApi.addMessage(id, reply, isInternal)
      setReply('')
      await load()
    } finally { setSending(false) }
  }

  async function handleStatusChange(status: string) {
    await ticketsApi.update(id, { status })
    await load()
  }

  async function handlePriorityChange(priority: string) {
    await ticketsApi.update(id, { priority })
    await load()
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><p className="text-sm text-muted-foreground">Carregando...</p></div>
  }

  if (!ticket) return null

  const activeOrders = clientOrders.filter((o) => o.status === 'ACTIVE')
  const pendingInvoices = clientInvoices.filter((i) => ['OPEN', 'OVERDUE'].includes(i.status))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-h2 font-semibold">#{ticket.number} — {ticket.subject}</h1>
              <Badge variant={STATUS_VARIANTS[ticket.status] ?? 'outline'}>
                {TICKET_STATUS_LABELS[ticket.status]}
              </Badge>
              <Badge variant={PRIORITY_VARIANTS[ticket.priority] ?? 'outline'}>
                {TICKET_PRIORITY_LABELS[ticket.priority]}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Aberto em {new Date(ticket.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Messages */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <Card>
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
                {ticket.messages?.map((msg) => {
                  const isStaff = !!msg.user
                  const name = msg.user?.name ?? msg.client?.name ?? 'Desconhecido'
                  const initial = name.charAt(0).toUpperCase()
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isStaff ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className={`text-xs ${isStaff ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[70%] ${isStaff ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{name}</span>
                          {msg.isInternal && (
                            <span className="flex items-center gap-1 text-[10px] text-warning">
                              <Lock className="h-3 w-3" /> Interno
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                          msg.isInternal
                            ? 'border border-warning/30 bg-warning/5 text-foreground'
                            : isStaff
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}>
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {!['CLOSED', 'RESOLVED'].includes(ticket.status) && (
                <div className="border-t border-border pt-4">
                  <Textarea
                    placeholder={isInternal ? 'Nota interna (não visível ao cliente)...' : 'Escrever resposta ao cliente...'}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                    className={isInternal ? 'border-warning/50 bg-warning/5' : ''}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded"
                      />
                      <Lock className="h-3.5 w-3.5" /> Nota interna
                    </label>
                    <Button onClick={handleSend} loading={sending} disabled={!reply.trim()}>
                      <Send className="mr-2 h-4 w-4" /> Responder
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Status/Priority */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Gerenciar ticket</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Status</p>
                <Select value={ticket.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Aberto</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                    <SelectItem value="WAITING_CLIENT">Aguardando cliente</SelectItem>
                    <SelectItem value="RESOLVED">Resolvido</SelectItem>
                    <SelectItem value="CLOSED">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Prioridade</p>
                <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="CRITICAL">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Client info */}
          {ticket.client && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" /> Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <p className="font-medium text-sm">{ticket.client.name}</p>
                <p className="text-xs text-muted-foreground">{ticket.client.email}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push(`/admin/clients/${ticket.client!.id}`)}
                >
                  Ver perfil completo <ExternalLink className="ml-1.5 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Active services */}
          {ticket.client && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Server className="h-4 w-4" /> Serviços ativos
                  </span>
                  <Badge variant={activeOrders.length > 0 ? 'success' : 'outline'} className="text-[10px]">
                    {activeOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeOrders.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum serviço ativo.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {activeOrders.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between cursor-pointer rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/admin/orders/${o.id}`)}
                      >
                        <p className="text-xs font-medium truncate">{o.plan?.name ?? 'Serviço'}</p>
                        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Open invoices */}
          {ticket.client && (
            <Card className={pendingInvoices.length > 0 ? 'border-warning/40' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <FileText className={`h-4 w-4 ${pendingInvoices.length > 0 ? 'text-warning' : ''}`} />
                    Faturas pendentes
                  </span>
                  <Badge variant={pendingInvoices.length > 0 ? 'warning' : 'outline'} className="text-[10px]">
                    {pendingInvoices.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingInvoices.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma fatura pendente.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {pendingInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between cursor-pointer rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/admin/invoices/${inv.id}`)}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium">{inv.number}</p>
                          <Badge variant={INVOICE_STATUS_VARIANTS[inv.status] ?? 'outline'} className="text-[9px] mt-0.5">
                            {INVOICE_STATUS_LABELS[inv.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <p className="text-xs font-semibold">{formatCurrency(inv.total)}</p>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Previous tickets */}
          {ticket.client && clientTickets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <HeadphonesIcon className="h-4 w-4" /> Tickets anteriores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1.5">
                  {clientTickets.slice(0, 5).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start justify-between cursor-pointer rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/admin/support/${t.id}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">#{t.number} {t.subject}</p>
                        <Badge
                          variant={STATUS_VARIANTS[t.status] ?? 'outline'}
                          className="text-[9px] mt-0.5"
                        >
                          {TICKET_STATUS_LABELS[t.status]}
                        </Badge>
                      </div>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground mt-1 ml-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overdue alert */}
          {pendingInvoices.some((i) => i.status === 'OVERDUE') && (
            <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0 mt-px" />
              <p>Este cliente tem faturas <strong>vencidas</strong>. Considere mencionar na resposta ou escalar internamente.</p>
            </div>
          )}

          {/* Timestamps */}
          <Card>
            <CardContent className="flex flex-col gap-2 p-4 text-xs text-muted-foreground">
              <div><span className="font-medium text-foreground">Aberto:</span> {new Date(ticket.createdAt).toLocaleString('pt-BR')}</div>
              <div><span className="font-medium text-foreground">Atualizado:</span> {new Date(ticket.updatedAt).toLocaleString('pt-BR')}</div>
              {ticket.closedAt && <div><span className="font-medium text-foreground">Fechado:</span> {new Date(ticket.closedAt).toLocaleString('pt-BR')}</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
