import { ComingSoon } from '@/components/ui/coming-soon'
import { Store } from 'lucide-react'

export default function StorePage() {
  return (
    <ComingSoon
      title="Loja"
      description="Configure sua loja pública para que clientes possam contratar serviços online."
      icon={Store}
    />
  )
}
