'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredUser, getStoredToken } from '@/lib/auth'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      router.replace('/login')
      return
    }

    const user = getStoredUser()
    const clientRoles = ['client', 'customer']
    const firstOrg = user?.organizations?.[0]

    if (firstOrg && clientRoles.includes(firstOrg.roleSlug ?? '')) {
      router.replace('/portal')
    } else {
      router.replace('/admin/dashboard')
    }
  }, [router])

  return null
}
