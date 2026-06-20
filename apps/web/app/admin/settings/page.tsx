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
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Building2, User, Lock } from 'lucide-react'

const orgSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  slug: z.string().min(2, 'Identificador obrigatório').regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
  domain: z.string().optional(),
})

const profileSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type OrgForm = z.infer<typeof orgSchema>
type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { user } = useAuthStore()
  const orgId = typeof window !== 'undefined' ? localStorage.getItem('nexano_org_id') : null

  const [orgLoading, setOrgLoading] = useState(true)
  const [orgSaving, setOrgSaving] = useState(false)
  const [orgSuccess, setOrgSuccess] = useState(false)
  const [orgError, setOrgError] = useState('')

  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  const orgForm = useForm<OrgForm>({ resolver: zodResolver(orgSchema) })
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  })
  const pwForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  useEffect(() => {
    if (!orgId) return
    api.get(`/admin/organizations/${orgId}`).then((r) => {
      const org = r.data
      orgForm.reset({ name: org.name, slug: org.slug, domain: org.domain ?? '' })
    }).finally(() => setOrgLoading(false))
  }, [orgId])

  useEffect(() => {
    if (user) profileForm.reset({ name: user.name, email: user.email })
  }, [user])

  async function onOrgSubmit(data: OrgForm) {
    if (!orgId) return
    setOrgSaving(true); setOrgError(''); setOrgSuccess(false)
    try {
      await api.patch(`/admin/organizations/${orgId}`, data)
      setOrgSuccess(true)
      setTimeout(() => setOrgSuccess(false), 3000)
    } catch (e: any) {
      setOrgError(e?.response?.data?.message || 'Erro ao salvar')
    } finally { setOrgSaving(false) }
  }

  async function onProfileSubmit(data: ProfileForm) {
    setProfileSaving(true); setProfileError(''); setProfileSuccess(false)
    try {
      await api.patch('/account/profile', data)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (e: any) {
      setProfileError(e?.response?.data?.message || 'Erro ao salvar')
    } finally { setProfileSaving(false) }
  }

  async function onPasswordSubmit(data: PasswordForm) {
    setPwSaving(true); setPwError(''); setPwSuccess(false)
    try {
      await api.post('/account/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      setPwSuccess(true)
      pwForm.reset()
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (e: any) {
      setPwError(e?.response?.data?.message || 'Senha atual incorreta')
    } finally { setPwSaving(false) }
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-h2 font-semibold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie as informações da sua organização e conta pessoal.
        </p>
      </div>

      {/* Org settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" /> Organização
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orgLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="flex flex-col gap-4">
              <Input
                label="Nome da organização"
                required
                placeholder="Minha Empresa"
                {...orgForm.register('name')}
                error={orgForm.formState.errors.name?.message}
              />
              <Input
                label="Identificador (slug)"
                required
                placeholder="minha-empresa"
                hint="Usado nas URLs e identificação interna"
                {...orgForm.register('slug')}
                error={orgForm.formState.errors.slug?.message}
              />
              <Input
                label="Domínio personalizado"
                placeholder="painel.minhaempresa.com"
                hint="Opcional — domínio white-label para seus clientes"
                {...orgForm.register('domain')}
              />
              {orgError && (
                <p className="text-sm text-destructive">{orgError}</p>
              )}
              <div className="flex items-center gap-3">
                <Button type="submit" loading={orgSaving}>Salvar organização</Button>
                {orgSuccess && (
                  <span className="flex items-center gap-1 text-sm text-success">
                    <CheckCircle className="h-4 w-4" /> Salvo!
                  </span>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Meu perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="flex flex-col gap-4">
            <Input
              label="Nome completo"
              required
              {...profileForm.register('name')}
              error={profileForm.formState.errors.name?.message}
            />
            <Input
              label="E-mail"
              required
              type="email"
              {...profileForm.register('email')}
              error={profileForm.formState.errors.email?.message}
            />
            {profileError && <p className="text-sm text-destructive">{profileError}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" loading={profileSaving}>Salvar perfil</Button>
              {profileSuccess && (
                <span className="flex items-center gap-1 text-sm text-success">
                  <CheckCircle className="h-4 w-4" /> Salvo!
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" /> Alterar senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={pwForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
            <Input
              label="Senha atual"
              type="password"
              required
              {...pwForm.register('currentPassword')}
              error={pwForm.formState.errors.currentPassword?.message}
            />
            <Separator />
            <Input
              label="Nova senha"
              type="password"
              required
              hint="Mínimo 8 caracteres"
              {...pwForm.register('newPassword')}
              error={pwForm.formState.errors.newPassword?.message}
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              required
              {...pwForm.register('confirmPassword')}
              error={pwForm.formState.errors.confirmPassword?.message}
            />
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" loading={pwSaving}>Alterar senha</Button>
              {pwSuccess && (
                <span className="flex items-center gap-1 text-sm text-success">
                  <CheckCircle className="h-4 w-4" /> Senha alterada!
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
