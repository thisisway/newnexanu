import { ComingSoon } from '@/components/ui/coming-soon'
import { ScrollText } from 'lucide-react'

export default function LogsPage() {
  return (
    <ComingSoon
      title="Logs"
      description="Visualize logs de sistema, erros e eventos de provisionamento."
      icon={ScrollText}
    />
  )
}
