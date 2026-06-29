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
  ChevronLeft,
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

const mainNav = [
  { label: 'Visão Geral',    href: '/admin/dashboard',      icon: LayoutDashboard },
  { label: 'Clientes',       href: '/admin/clients',         icon: Users },
  { label: 'Pedidos',        href: '/admin/orders',          icon: ShoppingCart },
  { label: 'Assinaturas',    href: '/admin/subscriptions',   icon: RefreshCcw },
  { label: 'Serviços',       href: '/admin/services',        icon: Server },
  { label: 'Produtos',       href: '/admin/products',        icon: Package },
  { label: 'Faturas',        href: '/admin/invoices',        icon: FileText },
  { label: 'Pagamentos',     href: '/admin/payments',        icon: CreditCard },
  { label: 'Domínios',       href: '/admin/domains',         icon: Globe },
  { label: 'Suporte',        href: '/admin/support',         icon: HeadphonesIcon },
  { label: 'Automações',     href: '/admin/automations',     icon: Zap },
  { label: 'Relatórios',     href: '/admin/reports',         icon: BarChart3 },
  { label: 'Loja',           href: '/admin/store',           icon: Store },
  { label: 'Integrações',    href: '/admin/integrations',    icon: Plug },
  { label: 'Equipe',         href: '/admin/team',            icon: Users2 },
  { label: 'Configurações',  href: '/admin/settings',        icon: Settings },
]

const techNav = [
  { label: 'Provisionamento', href: '/admin/provisioning', icon: Cpu },
  { label: 'Jobs',             href: '/admin/jobs',         icon: Briefcase },
  { label: 'Webhooks',         href: '/admin/webhooks',     icon: Webhook },
  { label: 'Logs',             href: '/admin/logs',         icon: ScrollText },
  { label: 'Servidores',       href: '/admin/servers',      icon: Monitor },
  { label: 'Módulos',          href: '/admin/modules',      icon: Boxes },
  { label: 'Auditoria',        href: '/admin/audit',        icon: ShieldCheck },
  { label: 'API',              href: '/admin/api',          icon: Code },
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
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
          active
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          collapsed && 'justify-center px-0',
        )}
      >
        <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="ml-2 font-medium">
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
        'sidebar-transition relative flex h-screen flex-col bg-sidebar shadow-md',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      )}
    >
      {/* Logo */}
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
          <Link href="/admin/dashboard" className="flex items-center gap-3">
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
        {mainNav.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}

        {/* Tech section */}
        <div className="pt-3">
          {!collapsed && (
            <p className="mb-1 px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              Técnico
            </p>
          )}
          {collapsed && <div className="my-2 mx-1 h-px bg-border" />}
          {techNav.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* Collapse button */}
      {onCollapse && (
        <div className="mx-2 mb-3">
          <button
            onClick={() => onCollapse(!collapsed)}
            className={cn(
              'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Recolher</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  )
}
