import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-success/10 text-success-600 dark:text-success',
        warning: 'bg-warning/10 text-warning-600 dark:text-warning',
        danger: 'bg-danger/10 text-danger-600 dark:text-danger',
        info: 'bg-info/10 text-info-600 dark:text-info',
        outline: 'border border-border text-foreground',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-primary': variant === 'default',
            'bg-success': variant === 'success',
            'bg-warning': variant === 'warning',
            'bg-danger': variant === 'danger',
            'bg-info': variant === 'info',
            'bg-muted-foreground': variant === 'muted',
          })}
        />
      )}
      {children}
    </div>
  )
}

// ── StatusBadge ────────────────────────────────────────────────────────────

const STATUS_MAP: Record<
  string,
  { label: string; variant: VariantProps<typeof badgeVariants>['variant'] }
> = {
  // Services / Generic
  active: { label: 'Ativo', variant: 'success' },
  inactive: { label: 'Inativo', variant: 'muted' },
  pending: { label: 'Pendente', variant: 'warning' },
  provisioning: { label: 'Provisionando', variant: 'info' },
  suspended: { label: 'Suspenso', variant: 'warning' },
  cancelled: { label: 'Cancelado', variant: 'muted' },
  terminated: { label: 'Encerrado', variant: 'muted' },
  error: { label: 'Com erro', variant: 'danger' },
  expired: { label: 'Expirado', variant: 'danger' },

  // Invoices
  paid: { label: 'Pago', variant: 'success' },
  unpaid: { label: 'Em aberto', variant: 'warning' },
  overdue: { label: 'Vencida', variant: 'danger' },
  draft: { label: 'Rascunho', variant: 'muted' },
  refunded: { label: 'Reembolsada', variant: 'info' },

  // Orders
  processing: { label: 'Processando', variant: 'info' },
  completed: { label: 'Concluído', variant: 'success' },
  failed: { label: 'Falhou', variant: 'danger' },

  // Tickets
  open: { label: 'Aberto', variant: 'danger' },
  answered: { label: 'Respondido', variant: 'info' },
  closed: { label: 'Fechado', variant: 'muted' },
  customer_reply: { label: 'Aguarda resposta', variant: 'warning' },

  // Users
  ACTIVE: { label: 'Ativo', variant: 'success' },
  SUSPENDED: { label: 'Suspenso', variant: 'warning' },
  BANNED: { label: 'Banido', variant: 'danger' },
  INVITED: { label: 'Convidado', variant: 'info' },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, variant: 'muted' as const }
  return (
    <Badge variant={config.variant} dot className={className}>
      {config.label}
    </Badge>
  )
}

export { Badge, badgeVariants, StatusBadge }
