'use client'

import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { productsApi, ConfigurableOption } from '@/lib/api/products'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  DrawerTitle, DrawerCloseButton,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  type: z.enum(['SELECT', 'RADIO', 'CHECKBOX', 'NUMBER', 'TEXT']),
  required: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  values: z.array(z.object({
    label: z.string().min(1, 'Rótulo obrigatório'),
    priceModifier: z.string().optional(),
  })),
})

type FormData = z.infer<typeof schema>

const TYPE_OPTIONS = [
  { value: 'SELECT', label: 'Lista suspensa' },
  { value: 'RADIO', label: 'Escolha única' },
  { value: 'CHECKBOX', label: 'Caixa de seleção' },
  { value: 'NUMBER', label: 'Número' },
  { value: 'TEXT', label: 'Texto' },
]

// SELECT/RADIO/CHECKBOX are value-based; NUMBER/TEXT are free input.
const VALUE_BASED = ['SELECT', 'RADIO', 'CHECKBOX']

interface OptionFormDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  option?: ConfigurableOption
  productId: string
}

export function OptionFormDrawer({ open, onClose, onSuccess, option, productId }: OptionFormDrawerProps) {
  const isEdit = !!option
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'SELECT', required: false, status: 'ACTIVE', values: [{ label: '', priceModifier: '0' }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'values' })
  const typeValue = watch('type')
  const statusValue = watch('status')
  const isValueBased = VALUE_BASED.includes(typeValue)

  useEffect(() => {
    if (open) {
      if (option) {
        reset({
          name: option.name,
          type: option.type,
          required: option.required,
          status: option.status,
          values: option.values.length
            ? option.values.map((v) => ({ label: v.label, priceModifier: v.priceModifier }))
            : [{ label: '', priceModifier: '0' }],
        })
      } else {
        reset({ type: 'SELECT', required: false, status: 'ACTIVE', values: [{ label: '', priceModifier: '0' }] })
      }
      setError('')
    }
  }, [open, option, reset])

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: data.name,
        type: data.type,
        required: data.required,
        status: data.status,
        // free-input types don't carry predefined values
        values: VALUE_BASED.includes(data.type)
          ? data.values.filter((v) => v.label.trim())
          : [],
      }
      if (isEdit) {
        await productsApi.updateOption(option.id, payload)
      } else {
        await productsApi.createOption(productId, payload)
      }
      onSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Erro ao salvar opção')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEdit ? 'Editar opção' : 'Nova opção configurável'}</DrawerTitle>
          <DrawerCloseButton />
        </DrawerHeader>

        <DrawerBody>
          <form id="option-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label="Nome da opção"
              required
              placeholder="Localização do servidor"
              {...register('name')}
              error={errors.name?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Tipo de campo</label>
                <Select value={typeValue} onValueChange={(v) => setValue('type', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
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

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" {...register('required')} />
              <span className="text-sm font-medium text-foreground">Obrigatório no checkout</span>
            </label>

            {isValueBased ? (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Opções de valor</label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => append({ label: '', priceModifier: '0' })}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  {fields.map((field, i) => (
                    <div key={field.id} className="flex items-end gap-2 rounded-lg border border-border p-3">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs text-muted-foreground">Rótulo</label>
                        <Input
                          className="h-8 text-sm"
                          placeholder="Ex.: São Paulo"
                          {...register(`values.${i}.label`)}
                          error={errors.values?.[i]?.label?.message}
                        />
                      </div>
                      <div className="w-32">
                        <label className="mb-1 block text-xs text-muted-foreground">Ajuste de preço (R$)</label>
                        <Input className="h-8 text-sm" placeholder="0,00" {...register(`values.${i}.priceModifier`)} />
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button" variant="ghost" size="icon-sm"
                          onClick={() => remove(i)}
                          className="text-muted-foreground hover:text-destructive mb-0.5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  O ajuste soma ao preço do plano. Use valores negativos para descontos.
                </p>
              </div>
            ) : (
              <p className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                Campos do tipo <strong>Número</strong> e <strong>Texto</strong> são preenchidos livremente pelo cliente e não possuem valores pré-definidos.
              </p>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </form>
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" form="option-form" loading={loading}>
            {isEdit ? 'Salvar' : 'Criar opção'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
