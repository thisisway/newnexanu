'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/components/providers/auth-provider'
import { login } from '@/lib/auth'
import { getErrorMessage } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

const schema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
  twoFactorCode: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showTwoFactor, setShowTwoFactor] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const result = await login(data.email, data.password, data.twoFactorCode)
      setUser(result.user)

      toast({
        title: 'Bem-vindo de volta!',
        description: `Olá, ${result.user.name.split(' ')[0]}. Você entrou com sucesso.`,
        variant: 'success' as any,
      })

      const firstOrg = result.user.organizations[0]
      const clientRoles = ['client', 'customer']
      if (firstOrg && !clientRoles.includes(firstOrg.roleSlug ?? '')) {
        router.push('/admin/dashboard')
      } else {
        router.push('/')
      }
    } catch (error) {
      const message = getErrorMessage(error)

      if (message.toLowerCase().includes('dois fatores') || message.toLowerCase().includes('2fa')) {
        setShowTwoFactor(true)
        toast({
          title: 'Verificação necessária',
          description: 'Informe seu código de autenticação de dois fatores.',
        })
      } else {
        toast({
          title: 'Não foi possível entrar',
          description: message,
          variant: 'destructive' as any,
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-h2 font-bold">Entrar na sua conta</h1>
        <p className="text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="voce@empresa.com"
            autoComplete="email"
            leftIcon={<Mail />}
            error={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            leftIcon={<Lock />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {showTwoFactor && (
          <div className="space-y-1.5">
            <Label htmlFor="twoFactorCode">Código de autenticação (2FA)</Label>
            <Input
              id="twoFactorCode"
              type="text"
              placeholder="000000"
              maxLength={6}
              autoComplete="one-time-code"
              {...register('twoFactorCode')}
            />
            <p className="text-xs text-muted-foreground">
              Abra seu app autenticador e informe o código de 6 dígitos.
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <div className="text-center text-xs text-muted-foreground">
        Ao entrar, você concorda com os{' '}
        <a href="#" className="hover:underline">
          Termos de Uso
        </a>{' '}
        e a{' '}
        <a href="#" className="hover:underline">
          Política de Privacidade
        </a>
        .
      </div>
    </div>
  )
}
