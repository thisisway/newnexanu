'use client'

import { useEffect, useState } from 'react'
import { Search, Check, Star, ShoppingCart } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, CYCLE_LABELS, PRODUCT_TYPE_LABELS } from '@/lib/api/products'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface StorePlan {
  id: string
  name: string
  isPopular: boolean
  features: string[]
  limits: Record<string, number>
  prices: { cycle: string; amount: string }[]
}

interface StoreProduct {
  id: string
  name: string
  description: string
  type: string
  category?: { name: string; icon: string }
  plans: StorePlan[]
}

const BILLING_PRIORITY = ['ANNUAL', 'SEMIANNUAL', 'QUARTERLY', 'MONTHLY', 'ONE_TIME']

function getBestPrice(prices: { cycle: string; amount: string }[]) {
  for (const cycle of BILLING_PRIORITY) {
    const found = prices.find((p) => p.cycle === cycle)
    if (found) return found
  }
  return prices[0]
}

export default function StorePage() {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCycle, setSelectedCycle] = useState('MONTHLY')

  useEffect(() => {
    api.get('/public/store/products').then((r) => {
      setProducts(r.data?.data ?? r.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="text-display font-bold text-foreground">
          Soluções para o seu negócio online
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          Hospedagem, VPS, domínios e muito mais. Configure e comece em minutos.
        </p>

        <div className="mt-8 max-w-md mx-auto">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 text-base"
          />
        </div>

        {/* Cycle toggle */}
        <div className="mt-6 inline-flex rounded-xl border border-border bg-card p-1">
          {['MONTHLY', 'ANNUAL'].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCycle(c)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                selectedCycle === c
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {CYCLE_LABELS[c]}
              {c === 'ANNUAL' && (
                <span className="ml-2 rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
                  -20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      {loading ? (
        <div className="grid gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((j) => <Skeleton key={j} className="h-48 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {filtered.map((product) => (
            <div key={product.id}>
              <div className="mb-6 flex items-center gap-3">
                <div>
                  <h2 className="text-h3 font-semibold text-foreground">{product.name}</h2>
                  {product.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{product.description}</p>
                  )}
                </div>
                <Badge variant="outline" className="ml-auto shrink-0">
                  {PRODUCT_TYPE_LABELS[product.type]}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {product.plans.map((plan) => {
                  const price = plan.prices.find((p) => p.cycle === selectedCycle) ?? getBestPrice(plan.prices)
                  const cycle = price?.cycle ?? selectedCycle

                  return (
                    <div
                      key={plan.id}
                      className={`relative flex flex-col rounded-2xl border p-6 transition-all hover:shadow-card-hover ${
                        plan.isPopular
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border bg-card'
                      }`}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <span className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white">
                            <Star className="h-3 w-3" fill="currentColor" />
                            Mais popular
                          </span>
                        </div>
                      )}

                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      </div>

                      {price ? (
                        <div className="mb-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-foreground">
                              {formatCurrency(price.amount)}
                            </span>
                            <span className="text-sm text-muted-foreground">/{CYCLE_LABELS[cycle]?.toLowerCase()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-6 text-muted-foreground text-sm">Consultar preço</div>
                      )}

                      <button className={`mb-6 w-full rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        plan.isPopular
                          ? 'bg-primary text-white hover:bg-primary/90'
                          : 'border border-border bg-card hover:bg-muted'
                      }`}>
                        <ShoppingCart className="h-4 w-4" />
                        Contratar
                      </button>

                      {plan.features && plan.features.length > 0 && (
                        <ul className="space-y-2.5 border-t border-border pt-5">
                          {(plan.features as string[]).map((f) => (
                            <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
