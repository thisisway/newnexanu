'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { productsApi, ProductCategory } from '@/lib/api/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  DrawerTitle, DrawerCloseButton,
} from '@/components/ui/drawer'
import { useForm } from 'react-hook-form'

interface CategoryForm {
  name: string
  slug: string
  description?: string
  icon?: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<ProductCategory | undefined>()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, setValue, watch } = useForm<CategoryForm>()
  const nameValue = watch('name')

  useEffect(() => {
    if (!editing && nameValue) {
      const slug = nameValue
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
      setValue('slug', slug)
    }
  }, [nameValue, editing, setValue])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await productsApi.listCategories()
    setCategories(res.data ?? res)
    setLoading(false)
  }

  function openNew() { setEditing(undefined); reset({}); setDrawerOpen(true) }

  function openEdit(cat: ProductCategory) {
    setEditing(cat)
    reset({ name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon })
    setDrawerOpen(true)
  }

  async function handleDelete(cat: ProductCategory) {
    if (!confirm(`Excluir categoria "${cat.name}"?`)) return
    await productsApi.deleteCategory(cat.id)
    load()
  }

  async function onSubmit(data: CategoryForm) {
    setSaving(true)
    try {
      if (editing) {
        await productsApi.updateCategory(editing.id, data)
      } else {
        await productsApi.createCategory(data)
      }
      setDrawerOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-h2 font-semibold text-foreground">Categorias de produto</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Organize seus produtos por categoria</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Nenhuma categoria"
          description="Crie categorias para organizar seus produtos."
          actions={[{ label: 'Nova categoria', onClick: openNew }]}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              {cat.icon && <span className="text-2xl">{cat.icon}</span>}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {cat._count?.products ?? 0} produto{(cat._count?.products ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(cat)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(cat)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={drawerOpen} onOpenChange={(o) => !o && setDrawerOpen(false)}>
        <DrawerContent width="w-[420px]">
          <DrawerHeader>
            <DrawerTitle>{editing ? 'Editar categoria' : 'Nova categoria'}</DrawerTitle>
            <DrawerCloseButton />
          </DrawerHeader>
          <DrawerBody>
            <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input label="Nome" required placeholder="Hospedagem" {...register('name')} />
              <Input label="Slug" required placeholder="hospedagem" {...register('slug')} />
              <Input label="Ícone (emoji)" placeholder="🌐" {...register('icon')} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Descrição opcional..."
                  {...register('description')}
                />
              </div>
            </form>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button type="submit" form="category-form" loading={saving}>
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
