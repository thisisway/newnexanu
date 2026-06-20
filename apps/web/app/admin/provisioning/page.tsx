import { ComingSoon } from '@/components/ui/coming-soon'
import { Cpu } from 'lucide-react'

export default function ProvisioningPage() {
  return (
    <ComingSoon
      title="Provisionamento"
      description="Configure módulos de provisionamento automático para seus produtos."
      icon={Cpu}
    />
  )
}
