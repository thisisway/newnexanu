// ─── Auth ─────────────────────────────────────────────────────────────────

export interface OrgMembership {
  id: string
  slug: string
  name?: string
  roleSlug: string
  permissions: string[]
}

export interface AuthUser {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
  twoFactorEnabled?: boolean
  organizations: OrgMembership[]
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

// ─── API ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  meta?: PaginationMeta
}

export interface PaginationMeta {
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: string
    timestamp: string
    path?: string
  }
}

// ─── Organization ─────────────────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  slug: string
  domain?: string | null
  logoUrl?: string | null
  plan: string
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

// ─── User ─────────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
  phone?: string | null
  twoFactorEnabled: boolean
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  lastLoginAt?: string | null
  emailVerifiedAt?: string | null
  createdAt: string
}

// ─── Role & Permission ────────────────────────────────────────────────────

export interface Permission {
  id: string
  action: string
  description?: string
  module: string
}

export interface Role {
  id: string
  name: string
  slug: string
  description?: string
  isSystem: boolean
  permissions: Array<{ permission: Permission }>
}

// ─── Audit Log ────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  organizationId?: string
  userId?: string
  action: string
  entity?: string
  entityId?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ip?: string
  userAgent?: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  createdAt: string
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>
}
