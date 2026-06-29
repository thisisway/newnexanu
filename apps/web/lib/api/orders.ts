import { api } from '@/lib/api'

export type OrderStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'FRAUD'
export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL' | 'BIANNUAL' | 'ONE_TIME'

export interface Order {
  id: string
  clientId: string
  planId: string
  planPriceId: string
  status: OrderStatus
  billingCycle: BillingCycle
  quantity: number
  unitPrice: string
  setupFee: string
  discount: string
  total: string
  notes?: string
  activatedAt?: string
  cancelledAt?: string
  createdAt: string
  client?: { id: string; name: string; email: string }
  plan?: { id: string; name: string; slug?: string }
  planPrice?: { cycle: BillingCycle; amount: string }
  subscription?: { id: string; status: string }
  invoices?: Invoice[]
  _count?: { invoices: number }
}

export interface Invoice {
  id: string
  clientId: string
  orderId?: string
  subscriptionId?: string
  number: string
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'
  currency: string
  subtotal: string
  discount: string
  tax: string
  total: string
  dueDate: string
  paidAt?: string
  notes?: string
  createdAt: string
  client?: { id: string; name: string; email: string }
  items?: InvoiceItem[]
  payments?: Payment[]
  _count?: { payments: number }
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: string
  discount: string
  total: string
}

export interface Payment {
  id: string
  invoiceId: string
  clientId: string
  method: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'BANK_TRANSFER' | 'BALANCE'
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'CHARGEBACK'
  amount: string
  currency: string
  pixCode?: string
  pixExpiry?: string
  paidAt?: string
  createdAt: string
  client?: { id: string; name: string }
  invoice?: { id: string; number: string; total: string }
}

export const ordersApi = {
  list: (params?: { clientId?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/admin/orders', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get(`/admin/orders/${id}`).then((r) => r.data),

  create: (data: {
    clientId: string
    planId: string
    planPriceId: string
    billingCycle: BillingCycle
    quantity?: number
    notes?: string
  }) => api.post('/admin/orders', data).then((r) => r.data),

  update: (id: string, data: { status?: OrderStatus; notes?: string }) =>
    api.patch(`/admin/orders/${id}`, data).then((r) => r.data),

  activate: (id: string) =>
    api.post(`/admin/orders/${id}/activate`).then((r) => r.data),

  cancel: (id: string) =>
    api.post(`/admin/orders/${id}/cancel`).then((r) => r.data),
}

export const invoicesApi = {
  list: (params?: { clientId?: string; orderId?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/admin/invoices', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get(`/admin/invoices/${id}`).then((r) => r.data),

  overdue: () =>
    api.get('/admin/invoices/overdue').then((r) => r.data),

  markPaid: (id: string) =>
    api.post(`/admin/invoices/${id}/mark-paid`).then((r) => r.data),

  cancel: (id: string) =>
    api.post(`/admin/invoices/${id}/cancel`).then((r) => r.data),
}

export const paymentsApi = {
  list: (params?: { invoiceId?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/admin/payments', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get(`/admin/payments/${id}`).then((r) => r.data),

  create: (data: { invoiceId: string; method: Payment['method'] }) =>
    api.post('/admin/payments', data).then((r) => r.data),

  confirm: (id: string) =>
    api.post(`/admin/payments/${id}/confirm`).then((r) => r.data),
}

export interface Subscription {
  id: string
  organizationId: string
  orderId: string
  clientId: string
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED'
  currentPeriodStart: string
  currentPeriodEnd: string
  nextBillingDate: string
  cancelAtPeriodEnd: boolean
  cancelledAt?: string
  trialEndsAt?: string
  createdAt: string
  client?: { id: string; name: string; email: string }
  order?: {
    id: string
    billingCycle: BillingCycle
    total: string
    plan?: { id: string; name: string }
  }
}

export const subscriptionsApi = {
  list: (params?: { clientId?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/admin/subscriptions', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get(`/admin/subscriptions/${id}`).then((r) => r.data),

  cancel: (id: string, atPeriodEnd = false) =>
    api.post(`/admin/subscriptions/${id}/cancel`, { atPeriodEnd }).then((r) => r.data),

  suspend: (id: string) =>
    api.post(`/admin/subscriptions/${id}/suspend`).then((r) => r.data),

  reactivate: (id: string) =>
    api.post(`/admin/subscriptions/${id}/reactivate`).then((r) => r.data),
}

export const SUBSCRIPTION_STATUS_LABELS: Record<Subscription['status'], string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Vencida',
  SUSPENDED: 'Suspensa',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado',
  FRAUD: 'Fraude',
}

export const INVOICE_STATUS_LABELS: Record<Invoice['status'], string> = {
  DRAFT: 'Rascunho',
  OPEN: 'Em aberto',
  PAID: 'Pago',
  OVERDUE: 'Vencida',
  CANCELLED: 'Cancelada',
  REFUNDED: 'Reembolsada',
}

export const PAYMENT_STATUS_LABELS: Record<Payment['status'], string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
  CHARGEBACK: 'Estorno',
}

export const PAYMENT_METHOD_LABELS: Record<Payment['method'], string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de crédito',
  BOLETO: 'Boleto',
  BANK_TRANSFER: 'Transferência',
  BALANCE: 'Saldo em conta',
}

export const CYCLE_LABELS: Record<BillingCycle, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
  BIANNUAL: 'Bianual',
  ONE_TIME: 'Pagamento único',
}

export function formatCurrency(value: string | number): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
