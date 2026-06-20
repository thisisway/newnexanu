import { LucideIcon, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComingSoonProps {
  title: string
  description?: string
  icon?: LucideIcon
  className?: string
}

export function ComingSoon({ title, description, icon: Icon = Wrench, className }: ComingSoonProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div>
        <h1 className="text-h2 font-semibold text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Em breve</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
        </p>
      </div>
    </div>
  )
}
