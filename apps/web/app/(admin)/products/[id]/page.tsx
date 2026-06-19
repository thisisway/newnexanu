'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Pencil, Trash2, Star, MoreHorizontal,
} from 'lucide-react'
import { productsApi, Product, Plan, CYCLE_LABELS, PRODUCT_TYPE_LABELS, formatCurrency } from '@/lib/api/products'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { ProductFormDrawer } from '../components/product-form-drawer'
import { PlanFormDrawer } from '../components/plan-form-drawer'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [editProductOpen, setEditProductOpen] = useState(false)
  const [planDrawerOpen, setPlanDrawerOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>()

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    try {
      const data = await productsApi.get(id)
      setProduct(data.data ?? data)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePlan(plan: Plan) {
    if (!confirm(`Excluir plano "${plan.name}"?`)) return
    await productsApi.deletePlan(plan.id)
    load()
  }

  function handleEditPlan(plan: Plan) {
    setEditingPlan(plan)
    setPlanDrawerOpen(true)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!product) return null

  const plans = product.plans ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-1 items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-h3 font-semibold text-foreground">{product.name}</h1>
              <StatusBadge status={product.status} />
              <Badge variant="outline" className="text-xs">{PRODUCT_TYPE_LABELS[product.type]}</Badge>
            </div>
            {product.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{product.description}</p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditProductOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar produto
        </Button>
      </div>

      {/* Plans */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Planos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{plans.length} plano{plans.length !== 1 ? 's' : ''} cadastrado{plans.length !== 1 ? 's' : ''}</p>
          </div>
          <Button
            size="sm"
            onClick={() => { setEditingPlan(undefined); setPlanDrawerOpen(true) }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo plano
          </Button>
        </div>

        {plans.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="Nenhum plano cadastrado"
            description="Adicione planos com preços para que os clientes possam contratar este produto."
            actions={[{ label: 'Criar primeiro plano', onClick: () => setPlanDrawerOpen(true) }]}
          />
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-xl border p-5 transition-all ${
                  plan.isPopular
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-background hover:border-primary/30'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                      <Star className="h-3 w-3" /> Popular
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    {plan.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{plan.description}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeletePlan(plan)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Prices */}
                {plan.prices.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {plan.prices.map((price) => (
                      <div key={price.id} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{CYCLE_LABELS[price.cycle]}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(price.amount)}
                          </span>
                          {Number(price.setupFee) > 0 && (
                            <span className="block text-xs text-muted-foreground">
                              + {formatCurrency(price.setupFee)} setup
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Features */}
                {plan.features && plan.features.length > 0 && (
                  <ul className="mt-4 space-y-1 border-t border-border pt-4">
                    {(plan.features as string[]).slice(0, 4).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-foreground">
                        <span className="text-primary">✓</span>
                        {f}
                      </li>
                    ))}
                    {(plan.features as string[]).length > 4 && (
                      <li className="text-xs text-muted-foreground">
                        +{(plan.features as string[]).length - 4} mais
                      </li>
                    )}
                  </ul>
                )}

                <div className="mt-3">
                  <StatusBadge status={plan.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawers */}
      <ProductFormDrawer
        open={editProductOpen}
        onClose={() => setEditProductOpen(false)}
        onSuccess={() => { setEditProductOpen(false); load() }}
        product={product}
        categories={[]}
      />

      <PlanFormDrawer
        open={planDrawerOpen}
        onClose={() => setPlanDrawerOpen(false)}
        onSuccess={() => { setPlanDrawerOpen(false); load() }}
        plan={editingPlan}
        productId={product.id}
      />
    </div>
  )
}
