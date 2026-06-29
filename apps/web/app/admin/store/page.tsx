import { ComingSoonRoadmap } from '@/components/ui/coming-soon'
import { Store } from 'lucide-react'

export default function StorePage() {
  return (
    <ComingSoonRoadmap
      title="Loja"
      description="Configure uma vitrine pública para que seus clientes possam contratar serviços online, sem intervenção manual."
      icon={Store}
      features={[
        { title: 'Vitrine de produtos', description: 'Exiba planos e preços em uma página pública com seu domínio personalizado.' },
        { title: 'Checkout próprio', description: 'Fluxo de compra completo com cadastro, pagamento e ativação automática.' },
        { title: 'Cupons de desconto', description: 'Crie e gerencie cupons com desconto percentual, fixo ou por período.' },
        { title: 'Personalização visual', description: 'Ajuste cores, logo e textos da loja para combinar com sua marca.' },
      ]}
    />
  )
}
