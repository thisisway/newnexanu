'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, Sun, Moon, Menu, ShoppingCart, FileText, HeadphonesIcon, Users, X } from 'lucide-react'
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

interface DashboardCounts {
  pendingOrders: number
  overdueInvoices: number
  openTickets: number
}

interface SearchResults {
  clients: Array<{ id: string; name: string; email: string; status: string }>
  invoices: Array<{ id: string; number: string; status: string; total: string; client?: { name: string } }>
  tickets: Array<{ id: string; number: number; subject: string; status: string; client?: { name: string } }>
}

interface AdminTopbarProps {
  onMenuToggle?: () => void
  className?: string
}

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho', OPEN: 'Em aberto', PAID: 'Pago',
  OVERDUE: 'Vencida', CANCELLED: 'Cancelada',
}
const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto', IN_PROGRESS: 'Em andamento', WAITING_CLIENT: 'Aguardando', RESOLVED: 'Resolvido', CLOSED: 'Fechado',
}

function formatCurrencyShort(value: string | number) {
  const n = Number(value)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

export function AdminTopbar({ onMenuToggle, className }: AdminTopbarProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [counts, setCounts] = useState<DashboardCounts>({ pendingOrders: 0, overdueInvoices: 0, openTickets: 0 })

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    api.get('/admin/stats/dashboard').then((r) => {
      const d = r.data?.data ?? r.data
      setCounts({
        pendingOrders: d?.pendingOrders ?? 0,
        overdueInvoices: d?.overdueInvoices ?? 0,
        openTickets: d?.openTickets ?? 0,
      })
    }).catch(() => {})
  }, [])

  const performSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null)
      setSearchOpen(false)
      return
    }
    setSearching(true)
    try {
      const res = await api.get('/admin/stats/search', { params: { q } })
      setResults(res.data?.data ?? res.data)
      setSearchOpen(true)
    } catch {
      setResults(null)
    } finally {
      setSearching(false)
    }
  }, [])

  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => performSearch(val), 300)
  }

  function clearSearch() {
    setQuery('')
    setResults(null)
    setSearchOpen(false)
    inputRef.current?.focus()
  }

  function navigate(href: string) {
    setSearchOpen(false)
    setQuery('')
    setResults(null)
    router.push(href)
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasResults = results && (
    results.clients.length > 0 || results.invoices.length > 0 || results.tickets.length > 0
  )

  const totalAlerts = counts.pendingOrders + counts.overdueInvoices + counts.openTickets

  const notifications = [
    counts.pendingOrders > 0 && {
      icon: ShoppingCart,
      label: `${counts.pendingOrders} pedido${counts.pendingOrders !== 1 ? 's' : ''} pendente${counts.pendingOrders !== 1 ? 's' : ''}`,
      href: '/admin/orders?status=PENDING',
      variant: 'warning' as const,
    },
    counts.overdueInvoices > 0 && {
      icon: FileText,
      label: `${counts.overdueInvoices} fatura${counts.overdueInvoices !== 1 ? 's' : ''} vencida${counts.overdueInvoices !== 1 ? 's' : ''}`,
      href: '/admin/invoices?status=OVERDUE',
      variant: 'danger' as const,
    },
    counts.openTickets > 0 && {
      icon: HeadphonesIcon,
      label: `${counts.openTickets} chamado${counts.openTickets !== 1 ? 's' : ''} aberto${counts.openTickets !== 1 ? 's' : ''}`,
      href: '/admin/support?status=OPEN',
      variant: 'default' as const,
    },
  ].filter(Boolean) as Array<{ icon: React.ComponentType<{ className?: string }>; label: string; href: string; variant: 'warning' | 'danger' | 'default' }>

  return (
    <header
      className={cn(
        'relative flex h-16 items-center gap-4 bg-card px-4 shadow-sm rounded-b-2xl z-10',
        className,
      )}
    >
      {/* Mobile menu trigger */}
      {onMenuToggle && (
        <Button variant="ghost" size="icon-sm" onClick={onMenuToggle} className="lg:hidden rounded-xl">
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-sm">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleSearchInput}
            onFocus={() => hasResults && setSearchOpen(true)}
            placeholder="Buscar clientes, faturas, chamados…"
            className="h-9 w-full rounded-xl border-0 bg-accent/60 pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:bg-card focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Search dropdown */}
        {searchOpen && (
          <div className="absolute top-full mt-1 w-full min-w-[360px] rounded-2xl border border-border bg-popover shadow-lg z-50">
            {searching ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Buscando…</div>
            ) : !hasResults ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhum resultado para <strong>{query}</strong>
              </div>
            ) : (
              <div className="py-1">
                {/* Clients */}
                {results!.clients.length > 0 && (
                  <div>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Clientes
                    </p>
                    {results!.clients.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigate(`/admin/clients/${c.id}`)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent rounded-xl mx-px transition-colors"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Users className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                        </div>
                        <Badge variant={c.status === 'ACTIVE' ? 'success' : 'outline'} className="text-[10px] shrink-0">
                          {c.status === 'ACTIVE' ? 'Ativo' : c.status}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}

                {/* Invoices */}
                {results!.invoices.length > 0 && (
                  <div>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Faturas
                    </p>
                    {results!.invoices.map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent rounded-xl mx-px transition-colors"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{inv.number}</p>
                          <p className="text-xs text-muted-foreground truncate">{inv.client?.name}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-medium">{formatCurrencyShort(inv.total)}</p>
                          <p className="text-[10px] text-muted-foreground">{INVOICE_STATUS_LABELS[inv.status] ?? inv.status}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tickets */}
                {results!.tickets.length > 0 && (
                  <div>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Chamados
                    </p>
                    {results!.tickets.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => navigate(`/admin/support/${t.id}`)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent rounded-xl mx-px transition-colors"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <HeadphonesIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">#{t.number} — {t.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">{t.client?.name}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {TICKET_STATUS_LABELS[t.status] ?? t.status}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}

                <div className="h-1" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
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
          <DropdownMenuContent align="end" className="w-72 rounded-2xl">
            <DropdownMenuLabel className="text-sm font-semibold font-heading">Alertas</DropdownMenuLabel>
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl mx-1"
                  >
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                      n.variant === 'warning' ? 'bg-warning/10' : n.variant === 'danger' ? 'bg-danger/10' : 'bg-primary/10',
                    )}>
                      <Icon className={cn(
                        'h-4 w-4',
                        n.variant === 'warning' ? 'text-warning' : n.variant === 'danger' ? 'text-danger' : 'text-primary',
                      )} />
                    </div>
                    <span className="text-sm">{n.label}</span>
                    <Badge variant={n.variant} className="ml-auto text-[10px] rounded-lg">Ver</Badge>
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
              className="rounded-xl"
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
            <Button variant="ghost" className="h-9 gap-2 px-2 rounded-xl">
              <UserAvatar name={user?.name || 'Usuário'} avatarUrl={user?.avatarUrl} size="sm" />
              <span className="hidden text-sm font-medium md:block">
                {user?.name?.split(' ')[0] || 'Usuário'}
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
            <DropdownMenuItem className="rounded-xl mx-1" onClick={() => router.push('/admin/account')}>
              Minha conta
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl mx-1" onClick={() => router.push('/admin/settings')}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive className="rounded-xl mx-1" onClick={logout}>
              Sair da conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
