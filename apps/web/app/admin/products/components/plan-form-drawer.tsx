'use client'

import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { productsApi, Plan } from '@/lib/api/products'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  DrawerTitle, DrawerCloseButton,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const priceSchema = z.object({
  cycle: z.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL', 'BIANNUAL', 'ONE_TIME']),
  amount: z.string().min(1, 'Valor obrigatório'),
  setupFee: z.string().optional(),
  isDefault: z.boolean().optional(),
})

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  slug: z.string().min(2, 'Slug obrigatório').regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']),
  isPopular: z.boolean().optional(),
  prices: z.array(priceSchema).min(1, 'Adicione ao menos um preço'),
})

type FormData = z.infer<typeof schema>

const CYCLE_OPTIONS = [
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'SEMIANNUAL', label: 'Semestral' },
  { value: 'ANNUAL', label: 'Anual' },
  { value: 'BIANNUAL', label: 'Bianual' },
  { value: 'ONE_TIME', label: 'Pagamento único' },
]

interface PlanFormDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  plan?: Plan
  productId: string
}

export function PlanFormDrawer({ open, onClose, onSuccess, plan, productId }: PlanFormDrawerProps) {
  const isEdit = !!plan
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'ACTIVE',
      isPopular: false,
      prices: [{ cycle: 'MONTHLY', amount: '', setupFee: '0' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'prices' })
  const nameValue = watch('name')
  const statusValue = watch('status')

  useEffect(() => {
    if (!isEdit && nameValue) {
      const slug = nameValue
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
      setValue('slug', slug)
    }
  }, [nameValue, isEdit, setValue])

  useEffect(() => {
    if (open) {
      if (plan) {
        reset({
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          status: plan.status,
          isPopular: plan.isPopular,
          prices: plan.prices.map((p) => ({
            cycle: p.cycle,
            amount: p.amount,
            setupFee: p.setupFee,
            isDefault: p.isDefault,
          })),
        })
      } else {
        reset({
          status: 'ACTIVE',
          isPopular: false,
          prices: [{ cycle: 'MONTHLY', amount: '', setupFee: '0' }],
        })
      }
      setError('')
    }
  }, [open, plan, reset])

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      if (isEdit) {
        await productsApi.updatePlan(plan.id, data)
      } else {
        await productsApi.createPlan({ ...data, productId })
      }
      onSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Erro ao salvar plano')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEdit ? 'Editar plano' : 'Novo plano'}</DrawerTitle>
          <DrawerCloseButton />
        </DrawerHeader>

        <DrawerBody>
          <form id="plan-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label="Nome do plano"
              required
              placeholder="Business"
              {...register('name')}
              error={errors.name?.message}
            />

            <Input
              label="Slug"
              required
              placeholder="business"
              {...register('slug')}
              error={errors.slug?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
                <Select value={statusValue} onValueChange={(v) => setValue('status', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                    <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" {...register('isPopular')} />
                  <span className="text-sm font-medium text-foreground">Marcar como popular</span>
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
              <Textarea placeholder="Descrição do plano..." rows={2} {...register('description')} />
            </div>

            {/* Prices */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Preços <span className="text-destructive">*</span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => append({ cycle: 'ANNUAL', amount: '', setupFee: '0' })}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {fields.map((field, i) => (
                  <div key={field.id} className="flex items-end gap-2 rounded-lg border border-border p-3">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs text-muted-foreground">Ciclo</label>
                      <Select
                        defaultValue={field.cycle}
                        onValueChange={(v) => setValue(`prices.${i}.cycle`, v as any)}
                      >
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CYCLE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-28">
                      <label className="mb-1 block text-xs text-muted-foreground">Valor (R$)</label>
                      <Input
                        className="h-8 text-sm"
                        placeholder="0,00"
                        {...register(`prices.${i}.amount`)}
                        error={errors.prices?.[i]?.amount?.message}
                      />
                    </div>
                    <div className="w-24">
                      <label className="mb-1 block text-xs text-muted-foreground">Setup (R$)</label>
                      <Input className="h-8 text-sm" placeholder="0,00" {...register(`prices.${i}.setupFee`)} />
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(i)}
                        className="text-muted-foreground hover:text-destructive mb-0.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {errors.prices?.message && (
                  <p className="text-xs text-destructive">{errors.prices.message}</p>
                )}
              </div>
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
          <Button type="submit" form="plan-form" loading={loading}>
            {isEdit ? 'Salvar' : 'Criar plano'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
