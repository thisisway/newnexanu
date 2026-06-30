'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/use-debounce'
import {
  Package, Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, RefreshCw, Tag, Power, PowerOff,
} from 'lucide-react'
import { productsApi, Product, ProductCategory, PRODUCT_TYPE_LABELS, formatCurrency } from '@/lib/api/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { DataTable, Pagination, Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductFormDrawer } from './components/product-form-drawer'

const TYPE_ICONS: Record<string, string> = {
  HOSTING: '🌐',
  VPS: '🖥️',
  DOMAIN: '🔤',
  SSL: '🔒',
  EMAIL: '📧',
  CLOUD_APP: '☁️',
  SERVICE: '⚙️',
  OTHER: '📦',
}

export default function ProductsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()

  const debouncedSearch = useDebounce(search, 400)

  const { data: prodRes, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'products', { search: debouncedSearch, status, categoryId, page }],
    queryFn: () => productsApi.list({
      search: debouncedSearch || undefined,
      status: status || undefined,
      categoryId: categoryId || undefined,
      page,
      limit: 20,
    }),
    placeholderData: keepPreviousData,
  })

  const products: Product[] = prodRes?.data ?? []
  const meta = prodRes?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 }

  const { data: categories = [] } = useQuery({
    queryKey: ['admin', 'product-categories'],
    queryFn: async (): Promise<ProductCategory[]> => {
      const catRes = await productsApi.listCategories()
      return catRes.data ?? catRes
    },
  })

  function handleEdit(p: Product) { setEditingProduct(p); setDrawerOpen(true) }
  function handleNew() { setEditingProduct(undefined); setDrawerOpen(true) }

  async function handleDelete(p: Product) {
    if (!confirm(`Excluir produto "${p.name}"?`)) return
    await productsApi.delete(p.id)
    refetch()
  }

  async function handleToggleStatus(p: Product) {
    const next = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    await productsApi.update(p.id, { status: next })
    refetch()
  }

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Produto',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="text-xl">{TYPE_ICONS[row.type] ?? '📦'}</span>
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoria',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.category?.name ?? '—'}</span>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      cell: (row) => (
        <Badge variant="outline" className="text-xs">{PRODUCT_TYPE_LABELS[row.type]}</Badge>
      ),
    },
    {
      key: 'plans',
      header: 'Planos',
      cell: (row) => (
        <span className="text-sm font-medium text-foreground">
          {row._count?.plans ?? 0}
        </span>
      ),
    },
    {
      key: 'lowestPrice',
      header: 'A partir de',
      cell: (row) => (
        row.lowestPrice != null ? (
          <span className="text-sm font-medium text-foreground">{formatCurrency(row.lowestPrice)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/products/${row.id}`) }}>
              <Eye className="mr-2 h-4 w-4" /> Ver planos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(row) }}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStatus(row) }}>
              {row.status === 'ACTIVE'
                ? <><PowerOff className="mr-2 h-4 w-4" /> Desativar</>
                : <><Power className="mr-2 h-4 w-4" /> Ativar</>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); handleDelete(row) }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 font-semibold text-foreground">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta.total} produto{meta.total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/products/categories')}>
            <Tag className="mr-2 h-4 w-4" />
            Categorias
          </Button>
          <Button size="sm" onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] max-w-sm">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="INACTIVE">Inativo</SelectItem>
            <SelectItem value="HIDDEN">Oculto</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={(v) => { setCategoryId(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <DataTable
          columns={columns}
          data={products}
          loading={isFetching}
          onRowClick={(row) => router.push(`/admin/products/${row.id}`)}
          emptyState={
            <EmptyState
              icon={Package}
              title="Nenhum produto encontrado"
              description="Crie seu primeiro produto para começar a vender."
              actions={[{ label: 'Novo produto', onClick: handleNew }]}
            />
          }
        />
        {meta.total > 0 && (
          <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
        )}
      </div>

      <ProductFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => { setDrawerOpen(false); refetch() }}
        product={editingProduct}
        categories={categories}
      />
    </div>
  )
}
