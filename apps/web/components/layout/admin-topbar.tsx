'use client'

import { Bell, Search, Sun, Moon, Menu } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { cn } from '@/lib/utils'

interface AdminTopbarProps {
  onMenuToggle?: () => void
  className?: string
}

export function AdminTopbar({ onMenuToggle, className }: AdminTopbarProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()

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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notificações</TooltipContent>
        </Tooltip>

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
            <DropdownMenuItem asChild>
              <a href="/admin/account">Minha conta</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/admin/settings">Configurações</a>
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
