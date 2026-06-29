'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ClientContact, clientsApi } from '@/lib/api/clients'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  DrawerTitle, DrawerCloseButton,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().optional(),
  isPrimary: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  clientId: string
  contact?: ClientContact
}

export function ContactFormDrawer({ open, onClose, onSuccess, clientId, contact }: Props) {
  const isEdit = !!contact
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isPrimary: false },
  })

  const isPrimary = watch('isPrimary')

  useEffect(() => {
    if (open) {
      reset(
        contact
          ? { name: contact.name, email: contact.email ?? '', phone: contact.phone ?? '', role: contact.role ?? '', isPrimary: contact.isPrimary }
          : { name: '', email: '', phone: '', role: '', isPrimary: false },
      )
      setError('')
    }
  }, [open, contact, reset])

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      const payload = { ...data, email: data.email || undefined }
      if (isEdit) {
        await clientsApi.updateContact(clientId, contact.id, payload)
      } else {
        await clientsApi.addContact(clientId, payload)
      }
      onSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Erro ao salvar contato')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEdit ? 'Editar contato' : 'Novo contato'}</DrawerTitle>
          <DrawerCloseButton />
        </DrawerHeader>

        <DrawerBody>
          <form id="contact-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Nome"
              required
              placeholder="Maria Souza"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="maria@empresa.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Telefone" placeholder="(11) 99999-0000" {...register('phone')} />
              <Input label="Cargo / Função" placeholder="Financeiro" {...register('role')} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!isPrimary}
                onChange={(e) => setValue('isPrimary', e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground">Contato principal</span>
            </label>

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
          <Button type="submit" form="contact-form" loading={loading}>
            {isEdit ? 'Salvar alterações' : 'Adicionar contato'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
