import { test } from 'node:test'
import * as assert from 'node:assert/strict'
import { ProductsService } from './products.service'

const audit = { log: async () => {} }

function makePrisma(overrides: Record<string, any> = {}) {
  const base: any = {
    product: { findFirst: async () => ({ id: 'prod1' }) },
    configurableOption: {
      create: async ({ data }: any) => ({ id: 'opt1', values: [], ...data }),
      findFirst: async () => ({ id: 'opt1', organizationId: 'org1' }),
      delete: async () => ({}),
    },
  }
  for (const [model, methods] of Object.entries(overrides)) {
    base[model] = { ...base[model], ...(methods as object) }
  }
  return base
}

test('createOption rejects a product from another organization', async () => {
  const prisma = makePrisma({ product: { findFirst: async () => null } })
  const svc = new ProductsService(prisma, audit as any)
  await assert.rejects(
    () => svc.createOption('org1', 'user1', 'foreignProduct', { name: 'Localização', values: [] } as any),
    /Produto não encontrado/i,
  )
})

test('createOption normalizes value price modifiers (comma + negative)', async () => {
  let captured: any
  const prisma = makePrisma({
    configurableOption: { create: async ({ data }: any) => { captured = data; return { id: 'opt1', values: [] } } },
  })
  const svc = new ProductsService(prisma, audit as any)
  await svc.createOption('org1', 'user1', 'prod1', {
    name: 'Painel',
    type: 'SELECT',
    values: [
      { label: 'cPanel', priceModifier: '19,90' },
      { label: 'Desconto', priceModifier: '-5,00' },
    ],
  } as any)

  const created = captured.values.create
  assert.equal(created[0].priceModifier, '19.90')
  assert.equal(created[1].priceModifier, '-5.00', 'negative modifiers are allowed for discounts')
})

test('removeOption rejects an option from another organization', async () => {
  const prisma = makePrisma({ configurableOption: { findFirst: async () => null } })
  const svc = new ProductsService(prisma, audit as any)
  await assert.rejects(
    () => svc.removeOption('org1', 'user1', 'foreignOption'),
    /Opção não encontrada/i,
  )
})
