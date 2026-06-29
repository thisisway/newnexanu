import { ComingSoonRoadmap } from '@/components/ui/coming-soon'
import { Store } from 'lucide-react'

export default function PortalStorePage() {
  return (
    <ComingSoonRoadmap
      title="Loja"
      description="Contrate novos serviços, faça upgrade de planos ou adicione recursos à sua conta."
      icon={Store}
      features={[
        { title: 'Catálogo de serviços', description: 'Navegue pelos planos disponíveis e compare preços e recursos.' },
        { title: 'Upgrade de plano', description: 'Faça upgrade do seu plano atual com crédito proporcional aplicado.' },
        { title: 'Addons e extras', description: 'Adicione recursos extras como mais espaço, e-mails ou IPs dedicados.' },
        { title: 'Checkout simplificado', description: 'Contrate novos serviços usando os dados de pagamento já cadastrados.' },
      ]}
    />
  )
}
