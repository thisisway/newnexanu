'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/components/providers/auth-provider'
import { register as authRegister } from '@/lib/auth'
import { getErrorMessage } from '@/lib/api'
import { slugify } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const schema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres.'),
  email: z.string().email('Informe um e-mail válido.'),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres.')
    .regex(/[A-Z]/, 'A senha deve ter pelo menos uma letra maiúscula.')
    .regex(/[0-9]/, 'A senha deve ter pelo menos um número.'),
  organizationName: z.string().min(2, 'O nome da empresa deve ter no mínimo 2 caracteres.'),
  organizationSlug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens.'),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const orgName = watch('organizationName')

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setValue('organizationName', value)
    setValue('organizationSlug', slugify(value))
  }

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authRegister(data)
      setUser(result.user)

      toast({
        title: 'Conta criada com sucesso!',
        description: `Bem-vindo ao Nexano, ${result.user.name.split(' ')[0]}!`,
        variant: 'success' as any,
      })

      router.push('/admin/dashboard')
    } catch (error) {
      toast({
        title: 'Não foi possível criar a conta',
        description: getErrorMessage(error),
        variant: 'destructive' as any,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-h2 font-bold">Criar sua conta</h1>
        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Seu nome</Label>
          <Input
            id="name"
            type="text"
            placeholder="João Silva"
            autoComplete="name"
            leftIcon={<User />}
            error={Boolean(errors.name)}
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail profissional</Label>
          <Input
            id="email"
            type="email"
            placeholder="voce@empresa.com"
            autoComplete="email"
            leftIcon={<Mail />}
            error={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
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
            error={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sua organização
          </p>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="organizationName">Nome da empresa</Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="Minha Empresa LTDA"
                leftIcon={<Building2 />}
                error={Boolean(errors.organizationName)}
                value={orgName || ''}
                onChange={handleOrgNameChange}
              />
              {errors.organizationName && (
                <p className="text-xs text-destructive">{errors.organizationName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="organizationSlug">
                Identificador{' '}
                <span className="font-normal text-muted-foreground">(URL da sua conta)</span>
              </Label>
              <div className="flex items-center">
                <span className="flex h-9 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-xs text-muted-foreground">
                  nexano.com/
                </span>
                <Input
                  id="organizationSlug"
                  type="text"
                  placeholder="minha-empresa"
                  className="rounded-l-none"
                  error={Boolean(errors.organizationSlug)}
                  {...register('organizationSlug')}
                />
              </div>
              {errors.organizationSlug && (
                <p className="text-xs text-destructive">{errors.organizationSlug.message}</p>
              )}
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          {isSubmitting ? 'Criando conta…' : 'Criar conta grátis'}
        </Button>
      </form>

      <div className="text-center text-xs text-muted-foreground">
        Ao criar sua conta, você concorda com os{' '}
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
