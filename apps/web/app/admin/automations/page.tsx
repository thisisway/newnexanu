import { ComingSoonRoadmap } from '@/components/ui/coming-soon'
import { Zap } from 'lucide-react'

export default function AutomationsPage() {
  return (
    <ComingSoonRoadmap
      title="Automações"
      description="Configure gatilhos e ações automáticas para seus fluxos de trabalho — sem código."
      icon={Zap}
      features={[
        { title: 'Gatilhos por evento', description: 'Dispare ações quando pedidos são criados, faturas vencem ou clientes são ativados.' },
        { title: 'Ações configuráveis', description: 'Envie e-mails, webhooks, atualize status ou crie faturas automaticamente.' },
        { title: 'Editor visual de fluxos', description: 'Monte fluxos de automação sem escrever código usando blocos arrastar-e-soltar.' },
        { title: 'Logs de execução', description: 'Acompanhe cada execução com logs detalhados e opção de reprocessamento.' },
      ]}
    />
  )
}
