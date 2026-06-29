'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Server,
  Globe,
  FileText,
  HeadphonesIcon,
  Store,
  Settings,
  Monitor,
  Cloud,
  Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

interface BadgeCounts {
  openInvoices: number
  openTickets: number
}

const baseNav = [
  { label: 'Início',          href: '/portal',          icon: Home,            exact: true },
  { label: 'Meus Serviços',   href: '/portal/services', icon: Server },
  { label: 'Sites',           href: '/portal/sites',    icon: Monitor },
  { label: 'VPS',             href: '/portal/vps',      icon: Cloud },
  { label: 'Cloud Apps',      href: '/portal/apps',     icon: Cloud },
  { label: 'Domínios',        href: '/portal/domains',  icon: Globe },
  { label: 'E-mail',          href: '/portal/email',    icon: Mail },
  { label: 'Faturas',         href: '/portal/invoices', icon: FileText,        badgeKey: 'openInvoices' as const },
  { label: 'Suporte',         href: '/portal/support',  icon: HeadphonesIcon,  badgeKey: 'openTickets' as const },
  { label: 'Loja',            href: '/portal/store',    icon: Store },
  { label: 'Configurações',   href: '/portal/settings', icon: Settings },
]

interface ClientSidebarProps {
  collapsed?: boolean
}

export function ClientSidebar({ collapsed = false }: ClientSidebarProps) {
  const pathname = usePathname()
  const [counts, setCounts] = useState<BadgeCounts>({ openInvoices: 0, openTickets: 0 })

  useEffect(() => {
    api.get('/portal/dashboard').then((r) => {
      setCounts({
        openInvoices: r.data?.openInvoices ?? 0,
        openTickets: r.data?.openTickets ?? 0,
      })
    }).catch(() => {})
  }, [])

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const NavItem = ({
    item,
  }: {
    item: {
      label: string
      href: string
      icon: React.ComponentType<{ className?: string }>
      exact?: boolean
      badgeKey?: keyof BadgeCounts
    }
  }) => {
    const active = isActive(item.href, item.exact)
    const Icon = item.icon
    const count = item.badgeKey ? counts[item.badgeKey] : 0

    const content = (
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
          active
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          collapsed && 'justify-center px-0',
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0',
            active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
          )}
        />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {count > 0 && (
              <Badge
                variant={item.badgeKey === 'openInvoices' ? 'warning' : 'danger'}
                className="h-5 min-w-5 justify-center text-[10px] rounded-lg"
              >
                {count}
              </Badge>
            )}
          </>
        )}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="ml-2 font-medium">
            {item.label}
            {count > 0 && (
              <span className="ml-1 rounded bg-warning/20 px-1 text-warning">{count}</span>
            )}
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  return (
    <aside
      className={cn(
        'sidebar-transition flex h-screen flex-col bg-sidebar shadow-md',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      )}
    >
      {/* Logo / Brand */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center px-4',
          collapsed && 'justify-center px-0',
        )}
      >
        {collapsed ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <span className="text-sm font-bold font-heading">N</span>
          </div>
        ) : (
          <Link href="/portal" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <span className="text-sm font-bold font-heading">N</span>
            </div>
            <span className="text-base font-bold font-heading text-foreground tracking-tight">Nexano</span>
          </Link>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-border" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {baseNav.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>

      {/* Help link */}
      {!collapsed && (
        <div className="px-3 pb-4">
          <div className="rounded-2xl bg-primary/8 p-4 border border-primary/10">
            <p className="text-xs font-semibold font-heading text-foreground">Precisa de ajuda?</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
              Nossa equipe está pronta para atender você.
            </p>
            <Link
              href="/portal/support/new"
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Abrir chamado →
            </Link>
          </div>
        </div>
      )}
    </aside>
  )
}
