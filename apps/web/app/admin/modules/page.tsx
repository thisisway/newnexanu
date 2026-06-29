import { ComingSoonRoadmap } from '@/components/ui/coming-soon'
import { Boxes } from 'lucide-react'

export default function ModulesPage() {
  return (
    <ComingSoonRoadmap
      title="Módulos"
      description="Instale e configure módulos para expandir as funcionalidades do Nexano conforme sua necessidade."
      icon={Boxes}
      features={[
        { title: 'Marketplace de módulos', description: 'Navegue e instale módulos oficiais e da comunidade com um clique.' },
        { title: 'Módulos de gateway', description: 'Adicione novos meios de pagamento sem alterar o código principal.' },
        { title: 'Módulos de provisionamento', description: 'Conecte novos painéis de hospedagem e registradores de domínio.' },
        { title: 'API de módulos', description: 'Desenvolva seus próprios módulos usando a SDK do Nexano.' },
      ]}
    />
  )
}
