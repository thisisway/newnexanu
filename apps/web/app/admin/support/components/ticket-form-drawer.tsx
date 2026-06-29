'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clientsApi, Client } from '@/lib/api/clients'
import { ticketsApi } from '@/lib/api/tickets'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  DrawerTitle, DrawerCloseButton,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

const schema = z.object({
  clientId: z.string().optional(),
  subject: z.string().min(5, 'Assunto deve ter ao menos 5 caracteres.'),
  body: z.string().min(10, 'Mensagem deve ter ao menos 10 caracteres.'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  category: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface TicketFormDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  preselectedClientId?: string
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export function TicketFormDrawer({ open, onClose, onSuccess, preselectedClientId }: TicketFormDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState('')

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM' },
  })

  const clientId = watch('clientId')
  const priority = watch('priority')

  useEffect(() => {
    if (!open) return
    reset({ priority: 'MEDIUM', clientId: preselectedClientId ?? '' })
    setError('')
    setClientSearch('')
    clientsApi.list({ limit: 200 }).then((res) => {
      const list = res.data ?? res
      setClients(list)
      if (preselectedClientId) {
        const found = list.find((c: { id: string; name: string }) => c.id === preselectedClientId)
        if (found) setClientSearch(found.name)
      }
    }).catch(() => {})
  }, [open, preselectedClientId, reset])

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      await ticketsApi.create({
        clientId: data.clientId || undefined,
        subject: data.subject,
        body: data.body,
        priority: data.priority,
        category: data.category || undefined,
      })
      onSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.response?.data?.error?.message || 'Erro ao criar chamado.')
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clientSearch
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.email.toLowerCase().includes(clientSearch.toLowerCase()),
      )
    : clients

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Novo chamado</DrawerTitle>
          <DrawerCloseButton />
        </DrawerHeader>

        <DrawerBody>
          <form id="ticket-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Client search */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Cliente (opcional)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Buscar cliente por nome ou e-mail..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
              {(clientSearch || clientId) && filteredClients.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-card">
                  {filteredClients.slice(0, 15).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setValue('clientId', c.id); setClientSearch(c.name) }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                        clientId === c.id ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subject */}
            <Input
              label="Assunto"
              required
              placeholder="Descreva o problema brevemente..."
              {...register('subject')}
              error={errors.subject?.message}
            />

            {/* Priority + Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Prioridade</label>
                <Select value={priority} onValueChange={(v) => setValue('priority', v as FormData['priority'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                label="Categoria"
                placeholder="Ex: Financeiro, Técnico..."
                {...register('category')}
              />
            </div>

            {/* Body */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Mensagem <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Descreva o problema em detalhes..."
                rows={5}
                {...register('body')}
              />
              {errors.body && (
                <p className="text-xs text-destructive">{errors.body.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </form>
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="ticket-form" loading={loading}>
            Criar chamado
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
