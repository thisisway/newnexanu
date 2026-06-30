'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Store, Check, Sparkles, ShoppingCart, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { CYCLE_LABELS, formatCurrency, PRODUCT_TYPE_LABELS } from '@/lib/api/products'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

interface CatalogPrice {
  id: string
  cycle: string
  amount: string
  setupFee: string
  isDefault: boolean
}
interface CatalogPlan {
  id: string
  name: string
  description?: string
  features?: string[]
  isPopular: boolean
  prices: CatalogPrice[]
}
interface CatalogProduct {
  id: string
  name: string
  description?: string
  type: string
  features?: string[]
  category?: { id: string; name: string }
  plans: CatalogPlan[]
}

interface Selection {
  product: CatalogProduct
  plan: CatalogPlan
  price: CatalogPrice
}

function defaultPrice(plan: CatalogPlan): CatalogPrice | undefined {
  return plan.prices.find((p) => p.isDefault) ?? plan.prices[0]
}

export default function PortalStorePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // planId -> selected priceId
  const [cycleByPlan, setCycleByPlan] = useState<Record<string, string>>({})
  const [checkout, setCheckout] = useState<Selection | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['portal', 'catalog'],
    queryFn: async (): Promise<CatalogProduct[]> => {
      const r = await api.get('/portal/catalog')
      return r.data?.data ?? r.data ?? []
    },
  })

  function priceFor(plan: CatalogPlan): CatalogPrice | undefined {
    const selectedId = cycleByPlan[plan.id]
    return plan.prices.find((p) => p.id === selectedId) ?? defaultPrice(plan)
  }

  async function confirmOrder() {
    if (!checkout) return
    setSubmitting(true)
    try {
      await api.post('/portal/orders', {
        planId: checkout.plan.id,
        planPriceId: checkout.price.id,
      })
      // Refresh anything that depends on the client's orders / billing.
      queryClient.invalidateQueries({ queryKey: ['portal', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'invoices'] })
      setCheckout(null)
      toast({
        title: 'Pedido criado!',
        description: 'Geramos a fatura da sua contratação. Conclua o pagamento para ativar o serviço.',
      })
      router.push('/portal/invoices')
    } catch (e: any) {
      toast({
        title: 'Não foi possível concluir',
        description: e?.response?.data?.message ?? 'Tente novamente em instantes.',
        variant: 'destructive' as any,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div>
        <h1 className="text-h2 font-bold text-foreground">Loja</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contrate novos serviços. A fatura é gerada na hora e o serviço é ativado após o pagamento.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Catálogo indisponível"
          description="Ainda não há serviços disponíveis para contratação. Fale com o suporte se precisar de algo específico."
          actions={[{ label: 'Abrir chamado', onClick: () => router.push('/portal/support/new') }]}
        />
      ) : (
        <div className="flex flex-col gap-10">
          {products.map((product) => (
            <section key={product.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">{product.name}</h2>
                <Badge variant="outline" className="text-[10px]">
                  {PRODUCT_TYPE_LABELS[product.type] ?? product.type}
                </Badge>
              </div>
              {product.description && (
                <p className="-mt-2 text-sm text-muted-foreground">{product.description}</p>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {product.plans.map((plan) => {
                  const price = priceFor(plan)
                  const features = (plan.features?.length ? plan.features : product.features) ?? []
                  return (
                    <Card
                      key={plan.id}
                      className={`relative flex flex-col ${plan.isPopular ? 'border-primary/50 shadow-md' : ''}`}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-2.5 left-4">
                          <Badge variant="default" className="gap-1 text-[10px] shadow-sm">
                            <Sparkles className="h-3 w-3" /> Mais popular
                          </Badge>
                        </div>
                      )}
                      <CardContent className="flex flex-1 flex-col gap-4 p-5">
                        <div>
                          <p className="font-semibold text-foreground">{plan.name}</p>
                          {plan.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                          )}
                        </div>

                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold font-heading">
                              {price ? formatCurrency(price.amount) : '—'}
                            </span>
                            {price && (
                              <span className="text-xs text-muted-foreground">
                                /{(CYCLE_LABELS[price.cycle] ?? price.cycle).toLowerCase()}
                              </span>
                            )}
                          </div>
                          {price && Number(price.setupFee) > 0 && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              + {formatCurrency(price.setupFee)} de taxa de ativação
                            </p>
                          )}
                        </div>

                        {plan.prices.length > 1 && (
                          <Select
                            value={price?.id}
                            onValueChange={(v) => setCycleByPlan((m) => ({ ...m, [plan.id]: v }))}
                          >
                            <SelectTrigger className="h-9 rounded-xl">
                              <SelectValue placeholder="Ciclo de cobrança" />
                            </SelectTrigger>
                            <SelectContent>
                              {plan.prices.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {CYCLE_LABELS[p.cycle] ?? p.cycle} — {formatCurrency(p.amount)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {features.length > 0 && (
                          <ul className="flex flex-col gap-1.5">
                            {features.slice(0, 6).map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <Button
                          className="mt-auto w-full rounded-xl"
                          disabled={!price}
                          onClick={() => price && setCheckout({ product, plan, price })}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" /> Contratar
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Checkout confirmation */}
      <Dialog open={Boolean(checkout)} onOpenChange={(o) => { if (!o && !submitting) setCheckout(null) }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar contratação</DialogTitle>
            <DialogDescription>
              Revise os detalhes antes de gerar a fatura.
            </DialogDescription>
          </DialogHeader>

          {checkout && (
            <div className="flex flex-col gap-3 py-1">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {checkout.product.name} · {checkout.plan.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Cobrança {(CYCLE_LABELS[checkout.price.cycle] ?? checkout.price.cycle).toLowerCase()}
                </p>
              </div>

              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="font-medium">{formatCurrency(checkout.price.amount)}</span>
                </div>
                {Number(checkout.price.setupFee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de ativação</span>
                    <span className="font-medium">{formatCurrency(checkout.price.setupFee)}</span>
                  </div>
                )}
                <div className="mt-1 flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total da 1ª fatura</span>
                  <span>{formatCurrency(Number(checkout.price.amount) + Number(checkout.price.setupFee))}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Após confirmar, geramos a fatura e você poderá pagá-la via PIX. O serviço é ativado
                automaticamente assim que o pagamento for confirmado.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setCheckout(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={confirmOrder} loading={submitting}>
              Confirmar e gerar fatura <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
