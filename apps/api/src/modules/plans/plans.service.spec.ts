import { test } from 'node:test'
import * as assert from 'node:assert/strict'
import { PlansService } from './plans.service'

const audit = { log: async () => {} }

/**
 * Builds a minimal Prisma mock. `$transaction(cb)` simply runs the callback
 * with the same mock as the transaction client, which is enough for these
 * unit tests since the service only uses model methods.
 */
function makePrisma(overrides: Record<string, any> = {}) {
  const base: any = {
    product: { findFirst: async () => ({ id: 'prod1' }) },
    plan: {
      findUnique: async () => null,
      findFirst: async () => ({ id: 'plan1', organizationId: 'org1', slug: 'basico', prices: [] }),
      create: async ({ data }: any) => ({ id: 'plan1', ...data }),
      update: async ({ data }: any) => ({ id: 'plan1', ...data }),
    },
    planPrice: {
      createMany: async () => ({ count: 0 }),
      findUnique: async () => null,
      findFirst: async () => null,
      create: async ({ data }: any) => ({ id: 'price1', ...data }),
      updateMany: async () => ({ count: 0 }),
      delete: async () => ({}),
      findMany: async () => [],
    },
  }
  base.$transaction = async (cb: any) => cb(base)
  // shallow-merge per-model overrides
  for (const [model, methods] of Object.entries(overrides)) {
    base[model] = { ...base[model], ...(methods as object) }
  }
  return base
}

const basePlanDto = {
  productId: 'prod1',
  name: 'Básico',
  slug: 'basico',
  status: 'ACTIVE',
} as any

test('create rejects a product that belongs to another organization', async () => {
  const prisma = makePrisma({ product: { findFirst: async () => null } })
  const svc = new PlansService(prisma, audit as any)
  await assert.rejects(
    () => svc.create('org1', 'user1', { ...basePlanDto, prices: [{ cycle: 'MONTHLY', amount: '10,00' }] }),
    /Produto não encontrado/i,
  )
})

test('create normalizes comma prices and assigns exactly one default', async () => {
  let captured: any
  const prisma = makePrisma({
    planPrice: { createMany: async (arg: any) => { captured = arg; return { count: arg.data.length } } },
  })
  const svc = new PlansService(prisma, audit as any)

  await svc.create('org1', 'user1', {
    ...basePlanDto,
    prices: [
      { cycle: 'MONTHLY', amount: '29,90' },
      { cycle: 'ANNUAL', amount: '299,90' },
    ],
  })

  assert.ok(captured, 'planPrice.createMany should have been called')
  assert.equal(captured.data.length, 2)
  const monthly = captured.data.find((d: any) => d.cycle === 'MONTHLY')
  assert.equal(monthly.amount, '29.90', 'comma amount must be stored as dot-decimal')
  assert.equal(captured.data.filter((d: any) => d.isDefault).length, 1, 'exactly one default')
  assert.equal(captured.data[0].isDefault, true, 'first price defaults when none specified')
})

test('create rejects duplicate billing cycles in the same plan', async () => {
  const prisma = makePrisma()
  const svc = new PlansService(prisma, audit as any)
  await assert.rejects(
    () => svc.create('org1', 'user1', {
      ...basePlanDto,
      prices: [
        { cycle: 'MONTHLY', amount: '10,00' },
        { cycle: 'MONTHLY', amount: '20,00' },
      ],
    }),
    /ciclo MONTHLY/i,
  )
})

test('create rejects a negative price', async () => {
  const prisma = makePrisma()
  const svc = new PlansService(prisma, audit as any)
  await assert.rejects(
    () => svc.create('org1', 'user1', { ...basePlanDto, prices: [{ cycle: 'MONTHLY', amount: '-1,00' }] }),
    /negativo/i,
  )
})

test('addPrice rejects a duplicate cycle', async () => {
  const prisma = makePrisma({
    planPrice: { findUnique: async () => ({ id: 'existing' }) },
  })
  const svc = new PlansService(prisma, audit as any)
  await assert.rejects(
    () => svc.addPrice('org1', 'plan1', { cycle: 'MONTHLY', amount: '10,00' } as any),
    /já existe um preço/i,
  )
})

test('addPrice unsets other defaults when the new price is default', async () => {
  let unsetCalled = false
  const prisma = makePrisma({
    planPrice: {
      findUnique: async () => null,
      updateMany: async (arg: any) => { if (arg.data?.isDefault === false) unsetCalled = true; return { count: 1 } },
    },
  })
  const svc = new PlansService(prisma, audit as any)
  await svc.addPrice('org1', 'plan1', { cycle: 'MONTHLY', amount: '29,90', isDefault: true } as any)
  assert.equal(unsetCalled, true, 'existing defaults should be cleared')
})

test('removePrice refuses to delete a price referenced by orders', async () => {
  const prisma = makePrisma({
    planPrice: { findFirst: async () => ({ id: 'price1', _count: { orders: 2 } }) },
  })
  const svc = new PlansService(prisma, audit as any)
  await assert.rejects(
    () => svc.removePrice('org1', 'plan1', 'price1'),
    /pedidos/i,
  )
})
