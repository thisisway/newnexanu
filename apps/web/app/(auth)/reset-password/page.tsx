'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

const schema = z.object({
  newPassword: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres.')
    .regex(/[A-Z]/, 'A senha deve ter pelo menos uma letra maiúscula.')
    .regex(/[0-9]/, 'A senha deve ter pelo menos um número.'),
  confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-h2 font-bold">Link inválido</h1>
          <p className="text-sm text-muted-foreground">
            Este link de redefinição é inválido ou expirou.
          </p>
        </div>
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-h2 font-bold">Senha redefinida!</h1>
          <p className="text-sm text-muted-foreground">
            Sua senha foi alterada com sucesso. Agora você pode entrar na sua conta.
          </p>
        </div>
        <Button className="w-full" size="lg" onClick={() => router.push('/login')}>
          Ir para o login
        </Button>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await api.post('/auth/reset-password', { token, password: data.newPassword })
      setDone(true)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Não foi possível redefinir sua senha. O link pode ter expirado.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-h2 font-bold">Criar nova senha</h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma senha forte para proteger sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">Nova senha</Label>
          <Input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
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
            error={Boolean(errors.newPassword)}
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className="text-xs text-destructive">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repita a nova senha"
            autoComplete="new-password"
            leftIcon={<Lock />}
            error={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          {isSubmitting ? 'Redefinindo…' : 'Redefinir senha'}
        </Button>
      </form>

      <div className="text-center">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
          Voltar para o login
        </Link>
      </div>
    </div>
  )
}
