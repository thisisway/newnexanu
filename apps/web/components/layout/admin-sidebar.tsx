'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Server,
  Package,
  FileText,
  CreditCard,
  Globe,
  HeadphonesIcon,
  Zap,
  BarChart3,
  Store,
  Plug,
  Users2,
  Settings,
  ChevronRight,
  Cpu,
  Briefcase,
  Webhook,
  ScrollText,
  Monitor,
  Boxes,
  ShieldCheck,
  Code,
  RefreshCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

const mainNav = [
  { label: 'Visão Geral', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Clientes', href: '/admin/clients', icon: Users },
  { label: 'Pedidos', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Assinaturas', href: '/admin/subscriptions', icon: RefreshCcw },
  { label: 'Serviços', href: '/admin/services', icon: Server },
  { label: 'Produtos', href: '/admin/products', icon: Package },
  { label: 'Faturas', href: '/admin/invoices', icon: FileText },
  { label: 'Pagamentos', href: '/admin/payments', icon: CreditCard },
  { label: 'Domínios', href: '/admin/domains', icon: Globe },
  { label: 'Suporte', href: '/admin/support', icon: HeadphonesIcon },
  { label: 'Automações', href: '/admin/automations', icon: Zap },
  { label: 'Relatórios', href: '/admin/reports', icon: BarChart3 },
  { label: 'Loja', href: '/admin/store', icon: Store },
  { label: 'Integrações', href: '/admin/integrations', icon: Plug },
  { label: 'Equipe', href: '/admin/team', icon: Users2 },
  { label: 'Configurações', href: '/admin/settings', icon: Settings },
]

const techNav = [
  { label: 'Provisionamento', href: '/admin/provisioning', icon: Cpu },
  { label: 'Jobs', href: '/admin/jobs', icon: Briefcase },
  { label: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
  { label: 'Logs', href: '/admin/logs', icon: ScrollText },
  { label: 'Servidores', href: '/admin/servers', icon: Monitor },
  { label: 'Módulos', href: '/admin/modules', icon: Boxes },
  { label: 'Auditoria', href: '/admin/audit', icon: ShieldCheck },
  { label: 'API', href: '/admin/api', icon: Code },
]

interface AdminSidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

export function AdminSidebar({ collapsed = false, onCollapse }: AdminSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  const NavItem = ({
    item,
  }: {
    item: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }
  }) => {
    const active = isActive(item.href)
    const Icon = item.icon

    const content = (
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150',
          active
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          collapsed && 'justify-center px-2',
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
          )}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && active && (
          <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-primary/60" />
        )}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="ml-1">
            {item.label}
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  return (
    <aside
      className={cn(
        'sidebar-transition flex h-screen flex-col border-r border-sidebar-border bg-sidebar',
        collapsed ? 'w-16' : 'w-sidebar',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-sidebar-border px-4',
          collapsed && 'justify-center px-2',
        )}
      >
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">N</span>
          </div>
        ) : (
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">N</span>
            </div>
            <span className="text-sm font-bold text-foreground">Nexano</span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-0.5">
          {mainNav.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>

        <Separator className="my-3" />

        {!collapsed && (
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Técnico
          </p>
        )}
        <div className="space-y-0.5">
          {techNav.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* Collapse button */}
      {onCollapse && (
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => onCollapse(!collapsed)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              collapsed && 'justify-center px-2',
            )}
          >
            <ChevronRight
              className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
            />
            {!collapsed && 'Recolher'}
          </button>
        </div>
      )}
    </aside>
  )
}
