'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { productsApi, Addon, Plan } from '@/lib/api/products'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  DrawerTitle, DrawerCloseButton,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  type: z.enum(['ONE_TIME', 'RECURRING']),
  price: z.string().min(1, 'Valor obrigatório'),
  setupFee: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  planId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddonFormDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  addon?: Addon
  plans: Plan[]
}

export function AddonFormDrawer({ open, onClose, onSuccess, addon, plans }: AddonFormDrawerProps) {
  const isEdit = !!addon
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'RECURRING', status: 'ACTIVE', setupFee: '0' },
  })

  const typeValue = watch('type')
  const statusValue = watch('status')
  const planIdValue = watch('planId')

  useEffect(() => {
    if (open) {
      if (addon) {
        reset({
          name: addon.name,
          description: addon.description,
          type: addon.type,
          price: addon.price,
          setupFee: addon.setupFee,
          status: addon.status,
          planId: addon.planId ?? undefined,
        })
      } else {
        reset({ type: 'RECURRING', status: 'ACTIVE', setupFee: '0' })
      }
      setError('')
    }
  }, [open, addon, reset])

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      const payload = { ...data, planId: data.planId || undefined }
      if (isEdit) {
        await productsApi.updateAddon(addon.id, payload)
      } else {
        await productsApi.createAddon(payload)
      }
      onSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Erro ao salvar add-on')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEdit ? 'Editar add-on' : 'Novo add-on'}</DrawerTitle>
          <DrawerCloseButton />
        </DrawerHeader>

        <DrawerBody>
          <form id="addon-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label="Nome do add-on"
              required
              placeholder="Backup premium"
              {...register('name')}
              error={errors.name?.message}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
              <Textarea placeholder="O que este add-on oferece..." rows={2} {...register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Cobrança</label>
                <Select value={typeValue} onValueChange={(v) => setValue('type', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECURRING">Recorrente</SelectItem>
                    <SelectItem value="ONE_TIME">Pagamento único</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
                <Select value={statusValue} onValueChange={(v) => setValue('status', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valor (R$)"
                required
                placeholder="0,00"
                {...register('price')}
                error={errors.price?.message}
              />
              <Input
                label="Taxa de ativação (R$)"
                placeholder="0,00"
                {...register('setupFee')}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Vincular a um plano</label>
              <Select
                value={planIdValue || 'none'}
                onValueChange={(v) => setValue('planId', v === 'none' ? undefined : v)}
              >
                <SelectTrigger><SelectValue placeholder="Geral (todos os planos)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geral (todos os planos)</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </form>
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" form="addon-form" loading={loading}>
            {isEdit ? 'Salvar' : 'Criar add-on'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
