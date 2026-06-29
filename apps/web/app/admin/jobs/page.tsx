import { ComingSoonRoadmap } from '@/components/ui/coming-soon'
import { Briefcase } from 'lucide-react'

export default function JobsPage() {
  return (
    <ComingSoonRoadmap
      title="Fila de Jobs"
      description="Visualize e gerencie tarefas agendadas e filas de processamento em background."
      icon={Briefcase}
      features={[
        { title: 'Visão em tempo real', description: 'Acompanhe jobs pendentes, em execução, concluídos e com falha.' },
        { title: 'Reprocessamento manual', description: 'Reexecute jobs falhos com um clique, sem precisar disparar o evento novamente.' },
        { title: 'Jobs agendados (Cron)', description: 'Configure tarefas recorrentes: geração de faturas, renovações, relatórios.' },
        { title: 'Alertas de falha', description: 'Receba notificações quando jobs críticos falham repetidamente.' },
      ]}
    />
  )
}
