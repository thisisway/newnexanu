import { test } from 'node:test'
import * as assert from 'node:assert/strict'
import { PortalService } from './portal.service'

function makeDeps(overrides: { prisma?: Record<string, any>; orders?: any } = {}) {
  const prisma: any = {
    user: { findUnique: async () => ({ email: 'joao@acme.com' }) },
    client: { findFirst: async () => ({ id: 'client1', email: 'joao@acme.com' }) },
    planPrice: { findFirst: async () => ({ id: 'pp1', cycle: 'MONTHLY' }) },
    product: { findMany: async () => [] },
  }
  for (const [model, methods] of Object.entries(overrides.prisma ?? {})) {
    prisma[model] = { ...prisma[model], ...(methods as object) }
  }
  const ordersService = overrides.orders ?? { create: async (_org: string, dto: any) => ({ id: 'order1', ...dto }) }
  return { prisma, ordersService }
}

const dto = { planId: 'plan1', planPriceId: 'pp1' } as any

test('createOrder rejects a price that is not an active plan of the org', async () => {
  let orderCreated = false
  const { prisma, ordersService } = makeDeps({
    prisma: { planPrice: { findFirst: async () => null } }, // not found for this org / inactive
    orders: { create: async () => { orderCreated = true; return {} } },
  })
  const svc = new PortalService(prisma, ordersService)
  await assert.rejects(() => svc.createOrder('user1', 'org1', dto), /indisponível/i)
  assert.equal(orderCreated, false, 'no order should be created for a foreign/inactive plan')
})

test('createOrder rejects when the user has no client profile', async () => {
  const { prisma, ordersService } = makeDeps({
    prisma: { client: { findFirst: async () => null } },
  })
  const svc = new PortalService(prisma, ordersService)
  await assert.rejects(() => svc.createOrder('user1', 'org1', dto), /Perfil de cliente/i)
})

test('createOrder delegates to OrdersService with the resolved client and cycle', async () => {
  let captured: any
  const { prisma, ordersService } = makeDeps({
    prisma: { planPrice: { findFirst: async () => ({ id: 'pp1', cycle: 'ANNUAL' }) } },
    orders: { create: async (_org: string, body: any) => { captured = body; return { id: 'order1' } } },
  })
  const svc = new PortalService(prisma, ordersService)
  const result = await svc.createOrder('user1', 'org1', { planId: 'plan1', planPriceId: 'pp1' } as any)

  assert.deepEqual(result, { id: 'order1' })
  assert.equal(captured.clientId, 'client1', 'order uses the resolved client, never a client id from the request')
  assert.equal(captured.planId, 'plan1')
  assert.equal(captured.planPriceId, 'pp1')
  assert.equal(captured.billingCycle, 'ANNUAL', 'billing cycle comes from the validated price')
  assert.equal(captured.quantity, 1)
})

test('getCatalog only lists active products that have an active plan', async () => {
  let where: any
  const { prisma, ordersService } = makeDeps({
    prisma: { product: { findMany: async (arg: any) => { where = arg.where; return [] } } },
  })
  const svc = new PortalService(prisma, ordersService)
  await svc.getCatalog('org1')

  assert.equal(where.organizationId, 'org1')
  assert.equal(where.status, 'ACTIVE')
  assert.deepEqual(where.plans, { some: { status: 'ACTIVE' } })
})
