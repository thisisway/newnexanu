'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Sun, Moon, FileText, HeadphonesIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface PortalCounts {
  openInvoices: number
  openTickets: number
}

interface ClientTopbarProps {
  className?: string
}

export function ClientTopbar({ className }: ClientTopbarProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [counts, setCounts] = useState<PortalCounts>({ openInvoices: 0, openTickets: 0 })

  useEffect(() => {
    api.get('/portal/dashboard').then((r) => {
      const d = r.data?.data ?? r.data
      setCounts({
        openInvoices: d?.openInvoices ?? 0,
        openTickets: d?.openTickets ?? 0,
      })
    }).catch(() => {})
  }, [])

  const totalAlerts = counts.openInvoices + counts.openTickets

  const notifications = [
    counts.openInvoices > 0 && {
      icon: FileText,
      label: `${counts.openInvoices} fatura${counts.openInvoices !== 1 ? 's' : ''} em aberto`,
      href: '/portal/invoices',
      variant: 'warning' as const,
    },
    counts.openTickets > 0 && {
      icon: HeadphonesIcon,
      label: `${counts.openTickets} chamado${counts.openTickets !== 1 ? 's' : ''} em aberto`,
      href: '/portal/support',
      variant: 'default' as const,
    },
  ].filter(Boolean) as Array<{ icon: React.ComponentType<{ className?: string }>; label: string; href: string; variant: 'warning' | 'default' }>

  return (
    <header
      className={cn(
        'relative flex h-16 items-center gap-4 bg-card px-4 shadow-sm rounded-b-2xl z-10',
        className,
      )}
    >
      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative rounded-xl">
              <Bell className="h-4 w-4" />
              {totalAlerts > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                  {totalAlerts > 9 ? '9+' : totalAlerts}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl">
            <DropdownMenuLabel className="text-sm font-semibold font-heading">Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nenhuma notificação pendente.
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = n.icon
                return (
                  <DropdownMenuItem
                    key={n.href}
                    onClick={() => router.push(n.href)}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <div className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                      n.variant === 'warning' ? 'bg-warning/10' : 'bg-primary/10',
                    )}>
                      <Icon className={cn('h-3.5 w-3.5', n.variant === 'warning' ? 'text-warning' : 'text-primary')} />
                    </div>
                    <span className="text-sm">{n.label}</span>
                  </DropdownMenuItem>
                )
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</TooltipContent>
        </Tooltip>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2">
              <UserAvatar name={user?.name || 'Você'} avatarUrl={user?.avatarUrl} size="sm" />
              <span className="hidden text-sm font-medium md:block">
                {user?.name?.split(' ')[0] || 'Você'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuLabel>
              <div>
                <p className="font-semibold font-heading">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/portal/settings')}>
              Configurações da conta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={logout}>
              Sair da conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
