import { api } from './api'
import type { AuthTokens, AuthUser } from '@/types'

export async function login(email: string, password: string, twoFactorCode?: string) {
  const { data } = await api.post<{ data: AuthTokens }>('/auth/login', {
    email,
    password,
    twoFactorCode,
  })
  const result = data.data ?? (data as unknown as AuthTokens)
  persistAuth(result)
  return result
}

export async function register(payload: {
  name: string
  email: string
  password: string
  organizationName: string
  organizationSlug: string
}) {
  const { data } = await api.post<{ data: AuthTokens }>('/auth/register', payload)
  const result = data.data ?? (data as unknown as AuthTokens)
  persistAuth(result)
  return result
}

export async function logout(refreshToken: string) {
  try {
    await api.post('/auth/logout', { refreshToken })
  } catch {
    // Ignore logout errors
  } finally {
    clearAuth()
  }
}

export async function getProfile(): Promise<AuthUser> {
  const { data } = await api.get<{ data: AuthUser }>('/auth/me')
  return data.data ?? (data as unknown as AuthUser)
}

export function persistAuth(tokens: AuthTokens) {
  localStorage.setItem('nexano_token', tokens.accessToken)
  localStorage.setItem('nexano_refresh_token', tokens.refreshToken)
  localStorage.setItem('nexano_user', JSON.stringify(tokens.user))

  const firstOrg = tokens.user.organizations[0]
  if (firstOrg) {
    localStorage.setItem('nexano_org_id', firstOrg.id)
  }

  // Set cookie so Next.js middleware can read it for route protection
  const isSecure = window.location.protocol === 'https:'
  document.cookie = `nexano_token=${tokens.accessToken}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`
}

export function clearAuth() {
  localStorage.removeItem('nexano_token')
  localStorage.removeItem('nexano_refresh_token')
  localStorage.removeItem('nexano_user')
  localStorage.removeItem('nexano_org_id')

  // Clear cookie
  document.cookie = 'nexano_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('nexano_user')
  if (!stored) return null
  try {
    return JSON.parse(stored) as AuthUser
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('nexano_token')
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredToken())
}
