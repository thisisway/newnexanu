'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { productsApi, Product, ProductCategory } from '@/lib/api/products'
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
  slug: z.string().min(2, 'Slug obrigatório').regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(['HOSTING', 'VPS', 'DOMAIN', 'SSL', 'EMAIL', 'CLOUD_APP', 'SERVICE', 'OTHER']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'HIDDEN']),
})

type FormData = z.infer<typeof schema>

interface ProductFormDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  product?: Product
  categories: ProductCategory[]
}

export function ProductFormDrawer({ open, onClose, onSuccess, product, categories }: ProductFormDrawerProps) {
  const isEdit = !!product
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'SERVICE', status: 'ACTIVE' },
  })

  const nameValue = watch('name')
  const typeValue = watch('type')
  const statusValue = watch('status')
  const categoryIdValue = watch('categoryId')

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
      if (product) {
        reset({
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.categoryId,
          type: product.type,
          status: product.status,
        })
      } else {
        reset({ type: 'SERVICE', status: 'ACTIVE' })
      }
      setError('')
    }
  }, [open, product, reset])

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      if (isEdit) {
        await productsApi.update(product.id, data)
      } else {
        await productsApi.create(data)
      }
      onSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Erro ao salvar produto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEdit ? 'Editar produto' : 'Novo produto'}</DrawerTitle>
          <DrawerCloseButton />
        </DrawerHeader>

        <DrawerBody>
          <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label="Nome do produto"
              required
              placeholder="Hospedagem Compartilhada"
              {...register('name')}
              error={errors.name?.message}
            />

            <Input
              label="Slug (URL)"
              required
              placeholder="hospedagem-compartilhada"
              {...register('slug')}
              error={errors.slug?.message}
              hint="Identificador único. Não pode ser alterado após clientes comprarem."
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Tipo</label>
                <Select value={typeValue} onValueChange={(v) => setValue('type', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOSTING">🌐 Hospedagem</SelectItem>
                    <SelectItem value="VPS">🖥️ VPS</SelectItem>
                    <SelectItem value="DOMAIN">🔤 Domínio</SelectItem>
                    <SelectItem value="SSL">🔒 SSL</SelectItem>
                    <SelectItem value="EMAIL">📧 E-mail</SelectItem>
                    <SelectItem value="CLOUD_APP">☁️ Cloud App</SelectItem>
                    <SelectItem value="SERVICE">⚙️ Serviço</SelectItem>
                    <SelectItem value="OTHER">📦 Outro</SelectItem>
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
                    <SelectItem value="HIDDEN">Oculto na loja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Categoria</label>
              <Select
                value={categoryIdValue || 'none'}
                onValueChange={(v) => setValue('categoryId', v === 'none' ? undefined : v)}
              >
                <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
              <Textarea placeholder="Descreva o produto..." rows={4} {...register('description')} />
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
          <Button type="submit" form="product-form" loading={loading}>
            {isEdit ? 'Salvar' : 'Criar produto'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
