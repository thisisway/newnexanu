import { api } from '@/lib/api'

export interface ProductCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  sortOrder: number
  _count?: { products: number }
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  categoryId?: string
  category?: ProductCategory
  type: 'HOSTING' | 'VPS' | 'DOMAIN' | 'SSL' | 'EMAIL' | 'CLOUD_APP' | 'SERVICE' | 'OTHER'
  status: 'ACTIVE' | 'INACTIVE' | 'HIDDEN'
  features?: string[]
  sortOrder: number
  createdAt: string
  plans?: Plan[]
  _count?: { plans: number }
}

export interface Plan {
  id: string
  productId: string
  product?: { id: string; name: string; type: string }
  name: string
  slug: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  features?: string[]
  limits?: Record<string, number>
  isPopular: boolean
  sortOrder: number
  prices: PlanPrice[]
  addons?: Addon[]
  _count?: { addons: number }
}

export interface PlanPrice {
  id: string
  planId: string
  currency: string
  cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL' | 'BIANNUAL' | 'ONE_TIME'
  amount: string
  setupFee: string
  trialDays: number
  isDefault: boolean
}

export interface Addon {
  id: string
  organizationId: string
  planId?: string
  plan?: { id: string; name: string }
  name: string
  description?: string
  type: 'ONE_TIME' | 'RECURRING'
  price: string
  setupFee: string
  status: 'ACTIVE' | 'INACTIVE'
}

export const productsApi = {
  // Categories
  listCategories: () =>
    api.get('/admin/products/categories').then((r) => r.data),

  createCategory: (data: Partial<ProductCategory>) =>
    api.post('/admin/products/categories', data).then((r) => r.data),

  updateCategory: (id: string, data: Partial<ProductCategory>) =>
    api.patch(`/admin/products/categories/${id}`, data).then((r) => r.data),

  deleteCategory: (id: string) =>
    api.delete(`/admin/products/categories/${id}`).then((r) => r.data),

  // Products
  list: (params?: { search?: string; status?: string; categoryId?: string; page?: number; limit?: number }) =>
    api.get('/admin/products', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get(`/admin/products/${id}`).then((r) => r.data),

  create: (data: Partial<Product>) =>
    api.post('/admin/products', data).then((r) => r.data),

  update: (id: string, data: Partial<Product>) =>
    api.patch(`/admin/products/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/admin/products/${id}`).then((r) => r.data),

  // Plans
  listPlans: (productId?: string) =>
    api.get('/admin/plans', { params: productId ? { productId } : undefined }).then((r) => r.data),

  getPlan: (id: string) =>
    api.get(`/admin/plans/${id}`).then((r) => r.data),

  createPlan: (data: Partial<Plan>) =>
    api.post('/admin/plans', data).then((r) => r.data),

  updatePlan: (id: string, data: Partial<Plan>) =>
    api.patch(`/admin/plans/${id}`, data).then((r) => r.data),

  deletePlan: (id: string) =>
    api.delete(`/admin/plans/${id}`).then((r) => r.data),

  // Addons
  listAddons: (planId?: string) =>
    api.get('/admin/addons', { params: planId ? { planId } : undefined }).then((r) => r.data),

  createAddon: (data: Partial<Addon>) =>
    api.post('/admin/addons', data).then((r) => r.data),

  updateAddon: (id: string, data: Partial<Addon>) =>
    api.patch(`/admin/addons/${id}`, data).then((r) => r.data),

  deleteAddon: (id: string) =>
    api.delete(`/admin/addons/${id}`).then((r) => r.data),
}

export const CYCLE_LABELS: Record<string, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
  BIANNUAL: 'Bianual',
  ONE_TIME: 'Único',
}

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  HOSTING: 'Hospedagem',
  VPS: 'VPS',
  DOMAIN: 'Domínio',
  SSL: 'SSL',
  EMAIL: 'E-mail',
  CLOUD_APP: 'Cloud App',
  SERVICE: 'Serviço',
  OTHER: 'Outro',
}

export function formatCurrency(value: string | number): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
