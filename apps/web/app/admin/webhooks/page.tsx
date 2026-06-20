import { ComingSoon } from '@/components/ui/coming-soon'
import { Webhook } from 'lucide-react'

export default function WebhooksPage() {
  return (
    <ComingSoon
      title="Webhooks"
      description="Configure endpoints para receber notificações de eventos em tempo real."
      icon={Webhook}
    />
  )
}
