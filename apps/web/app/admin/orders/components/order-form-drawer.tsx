'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clientsApi, Client } from '@/lib/api/clients'
import { productsApi, Plan, PlanPrice } from '@/lib/api/products'
import { ordersApi, BillingCycle, formatCurrency } from '@/lib/api/orders'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  DrawerTitle, DrawerCloseButton,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

const schema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  planId: z.string().min(1, 'Selecione um plano'),
  planPriceId: z.string().min(1, 'Selecione o ciclo de cobrança'),
  billingCycle: z.string().min(1, 'Selecione o ciclo de cobrança') as z.ZodType<BillingCycle>,
  quantity: z.coerce.number().min(1).default(1),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface OrderFormDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  preselectedClientId?: string
}

const CYCLE_LABELS: Record<string, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
  BIANNUAL: 'Bianual',
  ONE_TIME: 'Pagamento único',
}

export function OrderFormDrawer({ open, onClose, onSuccess, preselectedClientId }: OrderFormDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlanPrices, setSelectedPlanPrices] = useState<PlanPrice[]>([])

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  })

  const planId = watch('planId')

  useEffect(() => {
    if (!open) return
    reset({ quantity: 1, clientId: preselectedClientId ?? '' })
    setError('')
    setClientSearch('')
    setSelectedPlanPrices([])
    Promise.all([
      clientsApi.list({ limit: 100 }),
      productsApi.listPlans(),
    ]).then(([cls, pls]) => {
      const clientList: Client[] = cls.data ?? cls
      setClients(clientList)
      setPlans(pls.data ?? pls)
      if (preselectedClientId) {
        const preselected = clientList.find((c) => c.id === preselectedClientId)
        if (preselected) setClientSearch(preselected.name)
      }
    })
  }, [open, preselectedClientId, reset])

  useEffect(() => {
    if (!planId) { setSelectedPlanPrices([]); return }
    const plan = plans.find((p) => p.id === planId)
    if (plan?.prices) {
      setSelectedPlanPrices(plan.prices)
      setValue('planPriceId', '')
      setValue('billingCycle', '' as BillingCycle)
    }
  }, [planId, plans, setValue])

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      await ordersApi.create({
        clientId: data.clientId,
        planId: data.planId,
        planPriceId: data.planPriceId,
        billingCycle: data.billingCycle,
        quantity: data.quantity,
        notes: data.notes,
      })
      onSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.response?.data?.error?.message || 'Erro ao criar pedido')
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clientSearch
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.email.toLowerCase().includes(clientSearch.toLowerCase()),
      )
    : clients

  const clientId = watch('clientId')
  const planPriceId = watch('planPriceId')

  function handlePriceSelect(priceId: string) {
    setValue('planPriceId', priceId)
    const price = selectedPlanPrices.find((p) => p.id === priceId)
    if (price) setValue('billingCycle', price.cycle as BillingCycle)
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Novo pedido</DrawerTitle>
          <DrawerCloseButton />
        </DrawerHeader>

        <DrawerBody>
          <form id="order-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Client */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Cliente <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Buscar cliente por nome ou e-mail..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
              {filteredClients.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-card">
                  {filteredClients.slice(0, 20).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setValue('clientId', c.id); setClientSearch(c.name) }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                        clientId === c.id ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.clientId && (
                <p className="text-xs text-destructive">{errors.clientId.message}</p>
              )}
            </div>

            {/* Plan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Plano <span className="text-destructive">*</span>
              </label>
              <Select value={planId} onValueChange={(v) => setValue('planId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.product ? `${p.product.name} — ` : ''}{p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.planId && (
                <p className="text-xs text-destructive">{errors.planId.message}</p>
              )}
            </div>

            {/* Billing cycle / price */}
            {selectedPlanPrices.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Ciclo de cobrança <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPlanPrices.map((price) => (
                    <button
                      key={price.id}
                      type="button"
                      onClick={() => handlePriceSelect(price.id)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                        planPriceId === price.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 hover:bg-muted'
                      }`}
                    >
                      <p className="font-medium">{CYCLE_LABELS[price.cycle] ?? price.cycle}</p>
                      <p className="text-lg font-bold">{formatCurrency(price.amount)}</p>
                      {Number(price.setupFee) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          + {formatCurrency(price.setupFee)} setup
                        </p>
                      )}
                    </button>
                  ))}
                </div>
                {errors.planPriceId && (
                  <p className="text-xs text-destructive">{errors.planPriceId.message}</p>
                )}
              </div>
            )}

            {/* Quantity */}
            <Input
              label="Quantidade"
              type="number"
              min={1}
              {...register('quantity')}
              error={errors.quantity?.message}
            />

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Observações</label>
              <Textarea
                placeholder="Notas internas sobre o pedido..."
                rows={3}
                {...register('notes')}
              />
            </div>

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
          <Button type="submit" form="order-form" loading={loading}>
            Criar pedido
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
