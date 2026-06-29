import { ComingSoonRoadmap } from '@/components/ui/coming-soon'
import { Cpu } from 'lucide-react'

export default function ProvisioningPage() {
  return (
    <ComingSoonRoadmap
      title="Provisionamento"
      description="Configure módulos de provisionamento automático para criar recursos assim que um pedido é ativado."
      icon={Cpu}
      features={[
        { title: 'cPanel / WHM', description: 'Crie contas de hospedagem automaticamente ao ativar pedidos de hosting.' },
        { title: 'Plesk & DirectAdmin', description: 'Integração com os principais painéis de controle do mercado.' },
        { title: 'VPS (Virtulizor, Proxmox)', description: 'Provisione máquinas virtuais com configuração automática.' },
        { title: 'Registro de domínios', description: 'Registre domínios automaticamente via API do Registro.br e GoDaddy.' },
      ]}
    />
  )
}
