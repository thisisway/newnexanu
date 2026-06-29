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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  DrawerTitle, DrawerCloseButton,
} from '@/components/ui/drawer'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { UserPlus, Trash2, RefreshCw, Mail, Calendar } from 'lucide-react'

interface TeamMember {
  id: string
  userId: string
  joinedAt: string
  user: { id: string; name: string; email: string; avatarUrl?: string; lastLoginAt?: string }
  role: { id: string; name: string; slug: string } | null
}

interface Role {
  id: string
  name: string
  slug: string
}

const inviteSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  roleId: z.string().min(1, 'Selecione um papel'),
})
type InviteForm = z.infer<typeof inviteSchema>

export default function TeamPage() {
  const { user } = useAuthStore()
  const orgId = typeof window !== 'undefined' ? localStorage.getItem('nexano_org_id') : null

  const [members, setMembers] = useState<TeamMember[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  const form = useForm<InviteForm>({ resolver: zodResolver(inviteSchema) })
  const roleIdValue = form.watch('roleId')

  async function load() {
    setLoading(true)
    try {
      const [membersRes, rolesRes] = await Promise.all([
        api.get('/admin/team'),
        api.get('/admin/roles'),
      ])
      setMembers(membersRes.data?.data ?? membersRes.data ?? [])
      const rolesData = rolesRes.data?.data ?? rolesRes.data ?? {}
      setRoles([...(rolesData.systemRoles ?? []), ...(rolesData.customRoles ?? [])])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function onInvite(data: InviteForm) {
    setInviting(true); setInviteError('')
    try {
      await api.post('/admin/team/invite', data)
      setDrawerOpen(false)
      form.reset()
      load()
    } catch (e: any) {
      setInviteError(e?.response?.data?.message || 'Erro ao convidar membro')
    } finally { setInviting(false) }
  }

  async function handleRemove(memberId: string) {
    if (!orgId || !confirm('Remover este membro da equipe?')) return
    setRemovingId(memberId)
    try {
      await api.delete(`/admin/organizations/${orgId}/members/${memberId}`)
      load()
    } finally { setRemovingId(null) }
  }

  const roleSlugColor: Record<string, 'default' | 'success' | 'warning' | 'outline'> = {
    owner: 'success',
    admin: 'warning',
    viewer: 'outline',
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Invite drawer */}
      <Drawer open={drawerOpen} onOpenChange={(o) => !o && setDrawerOpen(false)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Convidar membro</DrawerTitle>
            <DrawerCloseButton />
          </DrawerHeader>
          <DrawerBody>
            <form id="invite-form" onSubmit={form.handleSubmit(onInvite)} className="flex flex-col gap-4">
              <Input
                label="Nome"
                required
                placeholder="João Silva"
                {...form.register('name')}
                error={form.formState.errors.name?.message}
              />
              <Input
                label="E-mail"
                required
                type="email"
                placeholder="joao@empresa.com"
                {...form.register('email')}
                error={form.formState.errors.email?.message}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Papel <span className="text-destructive">*</span>
                </label>
                <Select value={roleIdValue || ''} onValueChange={(v) => form.setValue('roleId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar papel" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      .filter((r) => !['client', 'customer'].includes(r.slug))
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.roleId && (
                  <p className="text-xs text-destructive">{form.formState.errors.roleId.message}</p>
                )}
              </div>
              {inviteError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {inviteError}
                </div>
              )}
            </form>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button type="submit" form="invite-form" loading={inviting}>
              <Mail className="mr-2 h-4 w-4" /> Enviar convite
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 font-semibold text-foreground">Equipe</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os membros da sua equipe e seus níveis de acesso.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={load} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => { setDrawerOpen(true); form.reset(); setInviteError('') }}>
            <UserPlus className="mr-2 h-4 w-4" /> Convidar membro
          </Button>
        </div>
      </div>

      {/* Members list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {loading ? '—' : `${members.length} membro${members.length !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {members.map((member) => {
                const isMe = member.user.id === user?.id
                const isOwner = member.role?.slug === 'owner'
                return (
                  <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback>
                        {member.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{member.user.name}</p>
                        {isMe && (
                          <Badge variant="outline" className="text-xs">Você</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      {member.user.lastLoginAt && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Calendar className="h-3 w-3" />
                          Último acesso: {new Date(member.user.lastLoginAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {member.role && (
                        <Badge variant={roleSlugColor[member.role.slug] ?? 'outline'}>
                          {member.role.name}
                        </Badge>
                      )}
                      {!isMe && !isOwner && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemove(member.userId)}
                          disabled={removingId === member.userId}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
