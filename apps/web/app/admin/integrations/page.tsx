import { ComingSoon } from '@/components/ui/coming-soon'
import { Plug } from 'lucide-react'

export default function IntegrationsPage() {
  return (
    <ComingSoon
      title="Integrações"
      description="Conecte o Nexano com gateways de pagamento, provedores e outros serviços."
      icon={Plug}
    />
  )
}
