'use client'

import { createContext, useContext, useEffect } from 'react'
import { create } from 'zustand'
import type { AuthUser } from '@/types'
import { getStoredUser } from '@/lib/auth'

interface AuthStore {
  user: AuthUser | null
  setUser: (user: AuthUser) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore()

  useEffect(() => {
    const stored = getStoredUser()
    if (stored) {
      setUser(stored)
    }
  }, [setUser])

  return <>{children}</>
}
