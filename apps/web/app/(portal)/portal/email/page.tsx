import { ComingSoonRoadmap } from '@/components/ui/coming-soon'
import { Mail } from 'lucide-react'

export default function PortalEmailPage() {
  return (
    <ComingSoonRoadmap
      title="E-mail Profissional"
      description="Gerencie suas caixas de e-mail profissional vinculadas aos seus domínios."
      icon={Mail}
      features={[
        { title: 'Criar e excluir caixas', description: 'Crie e-mails como nome@seudominio.com.br com poucos cliques.' },
        { title: 'Alterar senhas', description: 'Redefina a senha de qualquer caixa de e-mail do seu plano.' },
        { title: 'Configurar redirecionamento', description: 'Redirecione e-mails para outros endereços automaticamente.' },
        { title: 'Webmail', description: 'Acesse suas caixas pelo navegador sem precisar de um cliente de e-mail.' },
      ]}
    />
  )
}
