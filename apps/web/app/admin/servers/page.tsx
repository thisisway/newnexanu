import { ComingSoonRoadmap } from '@/components/ui/coming-soon'
import { Monitor } from 'lucide-react'

export default function ServersPage() {
  return (
    <ComingSoonRoadmap
      title="Servidores"
      description="Gerencie os servidores de infraestrutura conectados ao Nexano para provisionamento automático."
      icon={Monitor}
      features={[
        { title: 'Cadastro de servidores', description: 'Adicione servidores cPanel, Plesk, Proxmox e outros com credenciais de API.' },
        { title: 'Monitoramento de saúde', description: 'Verifique CPU, memória e disco em tempo real de cada servidor.' },
        { title: 'Balanceamento de carga', description: 'Distribua novos provisionamentos entre servidores por capacidade ou regra.' },
        { title: 'Grupos de servidores', description: 'Organize servidores por localização, tipo ou plano de produto.' },
      ]}
    />
  )
}
