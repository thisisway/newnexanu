import { LucideIcon, Wrench, CheckCircle } from 'lucide-react'
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

interface RoadmapFeature {
  title: string
  description: string
}

interface ComingSoonRoadmapProps extends ComingSoonProps {
  features?: RoadmapFeature[]
}

export function ComingSoonRoadmap({
  title,
  description,
  icon: Icon = Wrench,
  features = [],
  className,
}: ComingSoonRoadmapProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div>
        <h1 className="text-h2 font-semibold text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-8 py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Em desenvolvimento
        </span>
        <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">
          Esta funcionalidade está no roadmap e será lançada em breve.
        </p>
      </div>

      {features.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">O que está chegando</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
