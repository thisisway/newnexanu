'use client'

import { ClientSidebar } from '@/components/layout/client-sidebar'
import { ClientTopbar } from '@/components/layout/client-topbar'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ClientSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <ClientTopbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
