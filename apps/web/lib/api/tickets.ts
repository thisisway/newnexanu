import { api } from '@/lib/api'

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'RESOLVED' | 'CLOSED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Ticket {
  id: string
  number: number
  subject: string
  status: TicketStatus
  priority: TicketPriority
  category?: string
  createdAt: string
  updatedAt: string
  closedAt?: string
  client?: { id: string; name: string; email: string }
  assignedTo?: { id: string; name: string; avatarUrl?: string }
  _count?: { messages: number }
  messages?: TicketMessage[]
}

export interface TicketMessage {
  id: string
  ticketId: string
  body: string
  isInternal: boolean
  createdAt: string
  user?: { id: string; name: string; avatarUrl?: string }
  client?: { id: string; name: string }
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em andamento',
  WAITING_CLIENT: 'Aguardando cliente',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
}

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export const ticketsApi = {
  list: (params?: { status?: string; priority?: string; clientId?: string; page?: number; limit?: number }) =>
    api.get('/admin/tickets', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get(`/admin/tickets/${id}`).then((r) => r.data),

  create: (data: { clientId?: string; subject: string; body: string; priority?: string; category?: string }) =>
    api.post('/admin/tickets', data).then((r) => r.data),

  update: (id: string, data: Partial<{ status: string; priority: string; assignedToId: string | null; category: string }>) =>
    api.patch(`/admin/tickets/${id}`, data).then((r) => r.data),

  addMessage: (id: string, body: string, isInternal = false) =>
    api.post(`/admin/tickets/${id}/messages`, { body, isInternal }).then((r) => r.data),
}

export const portalTicketsApi = {
  list: () => api.get('/portal/tickets').then((r) => r.data),
  get: (id: string) => api.get(`/portal/tickets/${id}`).then((r) => r.data),
  create: (data: { subject: string; body: string; priority?: string; category?: string }) =>
    api.post('/portal/tickets', data).then((r) => r.data),
  addMessage: (id: string, body: string) =>
    api.post(`/portal/tickets/${id}/messages`, { body }).then((r) => r.data),
  close: (id: string) => api.patch(`/portal/tickets/${id}/close`).then((r) => r.data),
}
