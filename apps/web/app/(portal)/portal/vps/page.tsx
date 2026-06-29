import { ComingSoonRoadmap } from '@/components/ui/coming-soon'
import { Cloud } from 'lucide-react'

export default function PortalVpsPage() {
  return (
    <ComingSoonRoadmap
      title="Meus VPS"
      description="Gerencie seus servidores virtuais privados, acesso SSH e configurações de rede."
      icon={Cloud}
      features={[
        { title: 'Status e monitoramento', description: 'Veja CPU, memória e disco do seu VPS em tempo real.' },
        { title: 'Console de acesso', description: 'Acesse o terminal do servidor diretamente pelo navegador.' },
        { title: 'Reiniciar / Desligar', description: 'Controle o estado da máquina virtual com um clique.' },
        { title: 'Snapshots', description: 'Crie e restaure backups instantâneos do estado do servidor.' },
      ]}
    />
  )
}
