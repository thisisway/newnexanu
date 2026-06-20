import { ComingSoon } from '@/components/ui/coming-soon'
import { Server } from 'lucide-react'

export default function ServicesPage() {
  return (
    <ComingSoon
      title="Serviços"
      description="Gerencie os serviços provisionados dos seus clientes."
      icon={Server}
    />
  )
}
