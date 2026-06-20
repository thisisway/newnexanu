import { ComingSoon } from '@/components/ui/coming-soon'
import { Zap } from 'lucide-react'

export default function AutomationsPage() {
  return (
    <ComingSoon
      title="Automações"
      description="Configure gatilhos e ações automáticas para seus fluxos de trabalho."
      icon={Zap}
    />
  )
}
