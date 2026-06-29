'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Building2, User, FileText,
  Plus, Trash2, Lock, Send,
  Pencil, ShoppingCart, ExternalLink, HeadphonesIcon,
} from 'lucide-react'
import { clientsApi, Client, ClientNote, ClientContact } from '@/lib/api/clients'
import { ordersApi, invoicesApi, Order, Invoice, ORDER_STATUS_LABELS, INVOICE_STATUS_LABELS, formatCurrency, CYCLE_LABELS } from '@/lib/api/orders'
import { ticketsApi, Ticket, TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/lib/api/tickets'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ClientFormDrawer } from '../components/client-form-drawer'
import { ContactFormDrawer } from '../components/contact-form-drawer'
import { TicketFormDrawer } from '../../support/components/ticket-form-drawer'

const ORDER_STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  PENDING: 'warning', ACTIVE: 'success', SUSPENDED: 'warning', CANCELLED: 'danger', FRAUD: 'danger',
}

const INVOICE_STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  DRAFT: 'outline', OPEN: 'warning', PAID: 'success', OVERDUE: 'danger', CANCELLED: 'outline', REFUNDED: 'outline',
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value || '—'}</p>
    </div>
  )
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [noteContent, setNoteContent] = useState('')
  const [sendingNote, setSendingNote] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [contactDrawer, setContactDrawer] = useState<{ open: boolean; contact?: ClientContact }>({ open: false })
  const [ticketDrawerOpen, setTicketDrawerOpen] = useState(false)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    setLoading(true)
    try {
      const [clientData, ordersData, invoicesData, ticketsData] = await Promise.all([
        clientsApi.get(id),
        ordersApi.list({ clientId: id, limit: 5 }),
        invoicesApi.list({ clientId: id, limit: 5 }),
        ticketsApi.list({ clientId: id, limit: 5 }),
      ])
      setClient(clientData.data ?? clientData)
      setOrders(ordersData.data ?? ordersData)
      setInvoices(invoicesData.data ?? invoicesData)
      setTickets(ticketsData.data ?? ticketsData)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddNote() {
    if (!noteContent.trim()) return
    setSendingNote(true)
    try {
      await clientsApi.addNote(id, { content: noteContent, isInternal: true })
      setNoteContent('')
      load()
    } finally {
      setSendingNote(false)
    }
  }

  async function handleDeleteNote(noteId: string) {
    await clientsApi.deleteNote(id, noteId)
    load()
  }

  async function handleDeleteContact(contactId: string) {
    if (!confirm('Remover este contato?')) return
    await clientsApi.deleteContact(id, contactId)
    load()
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!client) return null

  const notes = (client.clientNotes ?? []) as ClientNote[]
  const contacts = client.contacts ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-1 items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            {client.type === 'COMPANY' ? (
              <Building2 className="h-5 w-5 text-primary" />
            ) : (
              <User className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-h3 font-semibold text-foreground">{client.name}</h1>
              <StatusBadge status={client.status} />
            </div>
            <p className="text-sm text-muted-foreground">{client.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Info */}
          <Section title="Informações">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label="Tipo" value={client.type === 'COMPANY' ? 'Empresa' : 'Pessoa Física'} />
              <Field label="Documento" value={client.document ? `${client.documentType}: ${client.document}` : undefined} />
              <Field label="Telefone" value={client.phone} />
              <Field label="Celular" value={client.mobile} />
              <Field
                label="Cadastrado em"
                value={new Date(client.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              />
            </div>
            {client.notes && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Observações</p>
                <p className="text-sm text-foreground whitespace-pre-line">{client.notes}</p>
              </div>
            )}
          </Section>

          {/* Notes */}
          <Section
            title={`Notas internas (${notes.length})`}
            action={<Lock className="h-3.5 w-3.5 text-muted-foreground" />}
          >
            <div className="flex flex-col gap-4">
              {/* Add note */}
              <div className="flex gap-3">
                <Textarea
                  placeholder="Adicionar nota interna..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleAddNote}
                  loading={sendingNote}
                  disabled={!noteContent.trim()}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Note list */}
              {notes.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhuma nota ainda.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {notes.map((note) => (
                    <div key={note.id} className="flex gap-3">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-xs">
                          {note.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 rounded-lg bg-muted/40 px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">{note.user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-foreground whitespace-pre-line">{note.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Contacts */}
          <Section
            title={`Contatos (${contacts.length})`}
            action={
              <Button variant="ghost" size="icon-sm" onClick={() => setContactDrawer({ open: true })}>
                <Plus className="h-4 w-4" />
              </Button>
            }
          >
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhum contato.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {contact.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                        {contact.isPrimary && (
                          <Badge variant="secondary" className="text-xs shrink-0">Principal</Badge>
                        )}
                      </div>
                      {contact.role && <p className="text-xs text-muted-foreground">{contact.role}</p>}
                      {contact.email && (
                        <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => setContactDrawer({ open: true, contact })}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Quick stats */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-4 text-sm font-semibold text-foreground">Resumo</p>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Pedidos', value: String(orders.length) },
                { label: 'Faturas em aberto', value: String(invoices.filter((i) => ['OPEN', 'OVERDUE'].includes(i.status)).length) },
                {
                  label: 'Total pago',
                  value: formatCurrency(invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + Number(i.total), 0)),
                },
                { label: 'Assinaturas ativas', value: String(orders.filter((o) => o.subscription?.status === 'ACTIVE').length) },
                { label: 'Chamados abertos', value: String(tickets.filter((t) => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orders */}
      <Section
        title={`Pedidos (${orders.length})`}
        action={
          <button
            onClick={() => router.push(`/admin/orders?clientId=${id}`)}
            className="text-xs text-primary hover:underline"
          >
            Ver todos
          </button>
        }
      >
        {orders.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">Nenhum pedido.</p>
        ) : (
          <div className="divide-y">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex cursor-pointer items-center justify-between gap-4 py-3 -mx-1 px-1 rounded-lg transition-colors hover:bg-muted/20"
                onClick={() => router.push(`/admin/orders/${order.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{order.plan?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{CYCLE_LABELS[order.billingCycle]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={ORDER_STATUS_VARIANTS[order.status] ?? 'outline'} className="text-xs">
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Invoices */}
      <Section
        title={`Faturas recentes (${invoices.length})`}
        action={
          <button
            onClick={() => router.push(`/admin/invoices?clientId=${id}`)}
            className="text-xs text-primary hover:underline"
          >
            Ver todas
          </button>
        }
      >
        {invoices.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">Nenhuma fatura.</p>
        ) : (
          <div className="divide-y">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex cursor-pointer items-center justify-between gap-4 py-3 -mx-1 px-1 rounded-lg transition-colors hover:bg-muted/20"
                onClick={() => router.push(`/admin/invoices/${inv.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{inv.number}</p>
                    <p className="text-xs text-muted-foreground">
                      Venc. {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={INVOICE_STATUS_VARIANTS[inv.status] ?? 'outline'} className="text-xs">
                    {INVOICE_STATUS_LABELS[inv.status]}
                  </Badge>
                  <p className="text-sm font-medium">{formatCurrency(inv.total)}</p>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Tickets */}
      <Section
        title={`Chamados (${tickets.length})`}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/admin/support?clientId=${id}`)}
              className="text-xs text-primary hover:underline"
            >
              Ver todos
            </button>
            <Button variant="ghost" size="icon-sm" onClick={() => setTicketDrawerOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">Nenhum chamado.</p>
            <Button size="sm" variant="outline" onClick={() => setTicketDrawerOpen(true)}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Abrir chamado
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex cursor-pointer items-center justify-between gap-4 py-3 -mx-1 px-1 rounded-lg transition-colors hover:bg-muted/20"
                onClick={() => router.push(`/admin/support/${ticket.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <HeadphonesIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      #{ticket.number} · {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={ticket.status === 'OPEN' ? 'warning' : ticket.status === 'IN_PROGRESS' ? 'default' : ticket.status === 'RESOLVED' ? 'success' : 'outline'} className="text-xs">
                    {TICKET_STATUS_LABELS[ticket.status]}
                  </Badge>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <ClientFormDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => { setEditOpen(false); load() }}
        client={client}
      />

      <ContactFormDrawer
        open={contactDrawer.open}
        onClose={() => setContactDrawer({ open: false })}
        onSuccess={() => { setContactDrawer({ open: false }); load() }}
        clientId={id}
        contact={contactDrawer.contact}
      />

      <TicketFormDrawer
        open={ticketDrawerOpen}
        onClose={() => setTicketDrawerOpen(false)}
        onSuccess={() => { setTicketDrawerOpen(false); load() }}
        preselectedClientId={id}
      />
    </div>
  )
}
