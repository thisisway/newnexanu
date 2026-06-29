'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { useAuthStore } from '@/components/providers/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserAvatar } from '@/components/ui/avatar'
import { CheckCircle } from 'lucide-react'

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z.string().min(8, 'Nova senha deve ter ao menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme a nova senha'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

function SuccessBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
      <CheckCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-auto text-success/60 hover:text-success">✕</button>
    </div>
  )
}

export default function AdminAccountPage() {
  const { user } = useAuthStore()
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '' },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    api.get('/account/profile').then((r) => {
      profileForm.reset({ name: r.data.name, email: r.data.email })
    }).catch(() => {})
  }, [])

  async function onProfileSubmit(values: ProfileValues) {
    setProfileError('')
    try {
      await api.patch('/account/profile', values)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 4000)
    } catch (e: any) {
      setProfileError(e?.response?.data?.message ?? 'Erro ao salvar perfil.')
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    setPasswordError('')
    try {
      await api.post('/account/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      setPasswordSuccess(true)
      passwordForm.reset()
      setTimeout(() => setPasswordSuccess(false), 4000)
    } catch (e: any) {
      setPasswordError(e?.response?.data?.message ?? 'Erro ao alterar senha.')
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-h2 font-semibold text-foreground">Minha conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie seu perfil e segurança de acesso.</p>
      </div>

      {/* Avatar preview */}
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <UserAvatar name={user?.name ?? 'Usuário'} avatarUrl={user?.avatarUrl} size="lg" />
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle>Dados pessoais</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="flex flex-col gap-4">
            {profileSuccess && (
              <SuccessBanner message="Perfil atualizado com sucesso!" onDismiss={() => setProfileSuccess(false)} />
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" {...profileForm.register('name')} />
              {profileForm.formState.errors.name && (
                <p className="text-xs text-destructive">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...profileForm.register('email')} disabled className="opacity-60 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado diretamente.</p>
            </div>
            {profileError && <p className="text-sm text-destructive">{profileError}</p>}
            <div className="flex justify-end">
              <Button type="submit" loading={profileForm.formState.isSubmitting}>
                Salvar alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader><CardTitle>Alterar senha</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
            {passwordSuccess && (
              <SuccessBanner message="Senha alterada com sucesso!" onDismiss={() => setPasswordSuccess(false)} />
            )}
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            <div className="flex justify-end">
              <Button type="submit" loading={passwordForm.formState.isSubmitting}>
                Alterar senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
