import { ComingSoon } from '@/components/ui/coming-soon'
import { Monitor } from 'lucide-react'

export default function ServersPage() {
  return (
    <ComingSoon
      title="Servidores"
      description="Gerencie os servidores de infraestrutura conectados à plataforma."
      icon={Monitor}
    />
  )
}
