import { ComingSoonRoadmap } from '@/components/ui/coming-soon'
import { Monitor } from 'lucide-react'

export default function PortalSitesPage() {
  return (
    <ComingSoonRoadmap
      title="Meus Sites"
      description="Gerencie seus sites de hospedagem, arquivos e configurações de domínio."
      icon={Monitor}
      features={[
        { title: 'Gerenciador de arquivos', description: 'Acesse e edite os arquivos do seu site diretamente pelo portal.' },
        { title: 'SSL e HTTPS', description: 'Visualize o status do certificado SSL e solicite renovação com um clique.' },
        { title: 'Métricas de uso', description: 'Acompanhe o consumo de disco, banda e número de acessos.' },
        { title: 'Acesso ao cPanel', description: 'Faça login automático no painel de controle do seu hosting.' },
      ]}
    />
  )
}
