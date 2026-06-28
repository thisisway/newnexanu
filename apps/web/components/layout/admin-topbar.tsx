'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, Sun, Moon, Menu, ShoppingCart, FileText, HeadphonesIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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

interface DashboardCounts {
  pendingOrders: number
  overdueInvoices: number
  openTickets: number
}

interface AdminTopbarProps {
  onMenuToggle?: () => void
  className?: string
}

export function AdminTopbar({ onMenuToggle, className }: AdminTopbarProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [counts, setCounts] = useState<DashboardCounts>({ pendingOrders: 0, overdueInvoices: 0, openTickets: 0 })

  useEffect(() => {
    api.get('/admin/stats/dashboard').then((r) => {
      setCounts({
        pendingOrders: r.data?.pendingOrders ?? 0,
        overdueInvoices: r.data?.overdueInvoices ?? 0,
        openTickets: r.data?.openTickets ?? 0,
      })
    }).catch(() => {})
  }, [])

  const totalAlerts = counts.pendingOrders + counts.overdueInvoices + counts.openTickets

  const notifications = [
    counts.pendingOrders > 0 && {
      icon: ShoppingCart,
      label: `${counts.pendingOrders} pedido${counts.pendingOrders !== 1 ? 's' : ''} pendente${counts.pendingOrders !== 1 ? 's' : ''}`,
      href: '/admin/orders',
      variant: 'warning' as const,
    },
    counts.overdueInvoices > 0 && {
      icon: FileText,
      label: `${counts.overdueInvoices} fatura${counts.overdueInvoices !== 1 ? 's' : ''} vencida${counts.overdueInvoices !== 1 ? 's' : ''}`,
      href: '/admin/invoices',
      variant: 'destructive' as const,
    },
    counts.openTickets > 0 && {
      icon: HeadphonesIcon,
      label: `${counts.openTickets} chamado${counts.openTickets !== 1 ? 's' : ''} aberto${counts.openTickets !== 1 ? 's' : ''}`,
      href: '/admin/support',
      variant: 'default' as const,
    },
  ].filter(Boolean) as Array<{ icon: React.ComponentType<{ className?: string }>; label: string; href: string; variant: 'warning' | 'destructive' | 'default' }>

  return (
    <header
      className={cn(
        'flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-sm',
        className,
      )}
    >
      {/* Mobile menu trigger */}
      {onMenuToggle && (
        <Button variant="ghost" size="icon-sm" onClick={onMenuToggle} className="lg:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Search */}
      <div className="flex-1 max-w-md">
        <Input
          leftIcon={<Search />}
          placeholder="Buscar clientes, faturas, serviços…"
          className="h-8 bg-muted/50 text-sm focus-visible:bg-background"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative">
              <Bell className="h-4 w-4" />
              {totalAlerts > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                  {totalAlerts > 9 ? '9+' : totalAlerts}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-sm font-semibold">Alertas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Tudo em dia! Nenhum alerta pendente.
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
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      n.variant === 'warning' ? 'bg-warning/10' : n.variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10',
                    )}>
                      <Icon className={cn(
                        'h-4 w-4',
                        n.variant === 'warning' ? 'text-warning' : n.variant === 'destructive' ? 'text-destructive' : 'text-primary',
                      )} />
                    </div>
                    <span className="text-sm">{n.label}</span>
                    <Badge variant={n.variant} className="ml-auto text-[10px]">Ver</Badge>
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

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2">
              <UserAvatar name={user?.name || 'Usuário'} avatarUrl={user?.avatarUrl} size="sm" />
              <span className="hidden text-sm font-medium md:block">
                {user?.name?.split(' ')[0] || 'Usuário'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin/account')}>
              Minha conta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
              Configurações
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
