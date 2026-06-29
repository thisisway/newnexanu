'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Client, clientsApi } from '@/lib/api/clients'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  DrawerTitle, DrawerDescription, DrawerCloseButton,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  type: z.enum(['INDIVIDUAL', 'COMPANY']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED']),
  documentType: z.enum(['CPF', 'CNPJ', 'OTHER']).optional(),
  document: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ClientFormDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  client?: Client
}

export function ClientFormDrawer({ open, onClose, onSuccess, client }: ClientFormDrawerProps) {
  const isEdit = !!client
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'INDIVIDUAL',
      status: 'ACTIVE',
    },
  })

  const type = watch('type')
  const statusValue = watch('status')
  const documentTypeValue = watch('documentType')

  useEffect(() => {
    if (open) {
      if (client) {
        reset({
          name: client.name,
          email: client.email,
          type: client.type,
          status: client.status,
          documentType: client.documentType,
          document: client.document,
          phone: client.phone,
          mobile: client.mobile,
          notes: client.notes,
        })
      } else {
        reset({ type: 'INDIVIDUAL', status: 'ACTIVE' })
      }
      setError('')
    }
  }, [open, client, reset])

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      if (isEdit) {
        await clientsApi.update(client.id, data)
      } else {
        await clientsApi.create(data)
      }
      onSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Erro ao salvar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEdit ? 'Editar cliente' : 'Novo cliente'}</DrawerTitle>
          <DrawerCloseButton />
        </DrawerHeader>

        <DrawerBody>
          <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input label="Nome completo" required placeholder="João Silva" {...register('name')} error={errors.name?.message} />
              </div>
              <div className="col-span-2">
                <Input label="E-mail" required type="email" placeholder="joao@exemplo.com" {...register('email')} error={errors.email?.message} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Tipo</label>
                <Select value={type} onValueChange={(v) => setValue('type', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Pessoa Física</SelectItem>
                    <SelectItem value="COMPANY">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
                <Select value={statusValue ?? 'ACTIVE'} onValueChange={(v) => setValue('status', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                    <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Tipo de documento</label>
                <Select value={documentTypeValue ?? ''} onValueChange={(v) => setValue('documentType', v as any)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                label="Número do documento"
                placeholder={type === 'COMPANY' ? '00.000.000/0001-00' : '000.000.000-00'}
                {...register('document')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Telefone" placeholder="(11) 3333-0000" {...register('phone')} />
              <Input label="Celular" placeholder="(11) 99999-0000" {...register('mobile')} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Observações internas</label>
              <Textarea placeholder="Notas sobre o cliente..." rows={3} {...register('notes')} />
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
          <Button type="submit" form="client-form" loading={loading}>
            {isEdit ? 'Salvar alterações' : 'Criar cliente'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
