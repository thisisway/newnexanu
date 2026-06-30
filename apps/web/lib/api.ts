import axios, { type AxiosError, type AxiosInstance } from 'axios'
import type { ApiError } from '@/types'

// Browser calls /api/backend/* which Next.js rewrites to the internal API.
// NEXT_PUBLIC_API_URL is only used server-side (next.config.mjs rewrites).
const BASE_URL = typeof window !== 'undefined'
  ? ''
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')

const API_PREFIX = typeof window !== 'undefined' ? '/api/backend' : '/api/v1'

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('nexano_token')
    const orgId = localStorage.getItem('nexano_org_id')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (orgId) {
      config.headers['X-Organization-Id'] = orgId
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('nexano_refresh_token')
        if (!refreshToken) {
          clearAuthStorage()
          window.location.href = '/login'
          return Promise.reject(error)
        }

        const { data } = await axios.post('/api/backend/auth/refresh', { refreshToken })
        const newToken = data.data?.accessToken || data.accessToken
        const newRefreshToken = data.data?.refreshToken || data.refreshToken

        localStorage.setItem('nexano_token', newToken)
        localStorage.setItem('nexano_refresh_token', newRefreshToken)
        // Keep the middleware-read cookie in sync with the refreshed token,
        // otherwise it keeps holding the previous (now stale) access token.
        const isSecure = window.location.protocol === 'https:'
        document.cookie = `nexano_token=${newToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${isSecure ? '; Secure' : ''}`

        originalRequest.headers!.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        clearAuthStorage()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)

function clearAuthStorage() {
  localStorage.removeItem('nexano_token')
  localStorage.removeItem('nexano_refresh_token')
  localStorage.removeItem('nexano_user')
  localStorage.removeItem('nexano_org_id')
  // Clear the cookie so the middleware stops redirecting away from /login
  document.cookie = 'nexano_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError
    return apiError?.error?.message || 'Ocorreu um erro inesperado.'
  }
  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado.'
}
