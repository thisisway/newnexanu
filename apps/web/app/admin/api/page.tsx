import { ComingSoon } from '@/components/ui/coming-soon'
import { Code } from 'lucide-react'

export default function ApiPage() {
  return (
    <ComingSoon
      title="API"
      description="Acesse a documentação e gerencie chaves de acesso à API do Nexano."
      icon={Code}
    />
  )
}
