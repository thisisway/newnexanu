import { ComingSoonRoadmap } from '@/components/ui/coming-soon'
import { Cloud } from 'lucide-react'

export default function PortalAppsPage() {
  return (
    <ComingSoonRoadmap
      title="Cloud Apps"
      description="Gerencie seus aplicativos em nuvem provisionados automaticamente."
      icon={Cloud}
      features={[
        { title: 'Deploy automático', description: 'Conecte seu repositório GitHub e faça deploy com um clique.' },
        { title: 'Variáveis de ambiente', description: 'Configure as variáveis da sua aplicação de forma segura.' },
        { title: 'Logs em tempo real', description: 'Acompanhe os logs da sua aplicação diretamente no portal.' },
        { title: 'Domínio personalizado', description: 'Aponte seu domínio para o aplicativo com configuração automática de SSL.' },
      ]}
    />
  )
}
