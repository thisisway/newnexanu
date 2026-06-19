'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/providers/auth-provider'
import { logout as authLogout } from '@/lib/auth'
import { toast } from '@/hooks/use-toast'

export function useAuth() {
  const router = useRouter()
  const { user, setUser, clearUser } = useAuthStore()

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('nexano_refresh_token')
    if (refreshToken) {
      await authLogout(refreshToken)
    }
    clearUser()
    toast({ title: 'Até logo!', description: 'Você saiu da sua conta.', variant: 'default' })
    router.push('/login')
  }, [clearUser, router])

  const hasPermission = useCallback(
    (permission: string, orgId?: string) => {
      if (!user) return false
      const orgs = orgId
        ? user.organizations.filter((o) => o.id === orgId)
        : user.organizations
      return orgs.some((o) => o.permissions.includes(permission))
    },
    [user],
  )

  const isOwner = useCallback(
    (orgId?: string) => {
      if (!user) return false
      const orgs = orgId
        ? user.organizations.filter((o) => o.id === orgId)
        : user.organizations
      return orgs.some((o) => o.roleSlug === 'owner')
    },
    [user],
  )

  return {
    user,
    setUser,
    logout,
    hasPermission,
    isOwner,
    isAuthenticated: Boolean(user),
  }
}
