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

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f7f7f8',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: '3px solid rgba(124,58,237,0.3)',
        borderTopColor: '#7c3aed',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
