import { ComingSoon } from '@/components/ui/coming-soon'
import { Briefcase } from 'lucide-react'

export default function JobsPage() {
  return (
    <ComingSoon
      title="Jobs"
      description="Visualize e gerencie tarefas agendadas e filas de processamento."
      icon={Briefcase}
    />
  )
}
