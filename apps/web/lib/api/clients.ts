import { api } from '@/lib/api'

export interface Client {
  id: string
  name: string
  email: string
  document?: string
  documentType?: 'CPF' | 'CNPJ' | 'OTHER'
  phone?: string
  mobile?: string
  type: 'INDIVIDUAL' | 'COMPANY'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELLED'
  notes?: string
  address?: Record<string, string>
  createdAt: string
  updatedAt: string
  contacts?: ClientContact[]
  clientNotes?: ClientNote[]
  _count?: { contacts: number; clientNotes: number }
}

export interface ClientContact {
  id: string
  clientId: string
  name: string
  email?: string
  phone?: string
  role?: string
  isPrimary: boolean
  createdAt: string
}

export interface ClientNote {
  id: string
  clientId: string
  userId: string
  content: string
  isInternal: boolean
  createdAt: string
  user: { id: string; name: string; avatarUrl?: string }
}

export interface ListClientsParams {
  search?: string
  status?: string
  type?: string
  page?: number
  limit?: number
}

export const clientsApi = {
  list: (params?: ListClientsParams) =>
    api.get('/admin/clients', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get(`/admin/clients/${id}`).then((r) => r.data),

  create: (data: Partial<Client>) =>
    api.post('/admin/clients', data).then((r) => r.data),

  update: (id: string, data: Partial<Client>) =>
    api.patch(`/admin/clients/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/admin/clients/${id}`).then((r) => r.data),

  addContact: (clientId: string, data: Partial<ClientContact>) =>
    api.post(`/admin/clients/${clientId}/contacts`, data).then((r) => r.data),

  updateContact: (clientId: string, contactId: string, data: Partial<ClientContact>) =>
    api.patch(`/admin/clients/${clientId}/contacts/${contactId}`, data).then((r) => r.data),

  deleteContact: (clientId: string, contactId: string) =>
    api.delete(`/admin/clients/${clientId}/contacts/${contactId}`).then((r) => r.data),

  addNote: (clientId: string, data: { content: string; isInternal?: boolean }) =>
    api.post(`/admin/clients/${clientId}/notes`, data).then((r) => r.data),

  deleteNote: (clientId: string, noteId: string) =>
    api.delete(`/admin/clients/${clientId}/notes/${noteId}`).then((r) => r.data),

  enablePortalAccess: (id: string) =>
    api.post(`/admin/clients/${id}/portal-access`).then((r) => r.data?.data ?? r.data),
}
