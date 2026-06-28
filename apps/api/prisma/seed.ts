import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PERMISSIONS = [
  // Organization
  { action: 'organization:read', module: 'organization', description: 'Ver dados da organização' },
  { action: 'organization:update', module: 'organization', description: 'Editar organização' },
  { action: 'organization:delete', module: 'organization', description: 'Excluir organização' },

  // Team
  { action: 'team:read', module: 'team', description: 'Ver membros da equipe' },
  { action: 'team:manage', module: 'team', description: 'Convidar e gerenciar membros' },

  // Roles
  { action: 'roles:read', module: 'roles', description: 'Ver papéis e permissões' },
  { action: 'roles:manage', module: 'roles', description: 'Criar e editar papéis' },

  // Clients
  { action: 'clients:read', module: 'clients', description: 'Ver clientes' },
  { action: 'clients:create', module: 'clients', description: 'Criar clientes' },
  { action: 'clients:update', module: 'clients', description: 'Editar clientes' },
  { action: 'clients:delete', module: 'clients', description: 'Excluir clientes' },
  { action: 'clients:impersonate', module: 'clients', description: 'Acessar como cliente' },

  // Products
  { action: 'products:read', module: 'products', description: 'Ver produtos e planos' },
  { action: 'products:create', module: 'products', description: 'Criar produtos e planos' },
  { action: 'products:update', module: 'products', description: 'Editar produtos e planos' },
  { action: 'products:delete', module: 'products', description: 'Excluir produtos e planos' },

  // Orders
  { action: 'orders:read', module: 'orders', description: 'Ver pedidos' },
  { action: 'orders:create', module: 'orders', description: 'Criar pedidos' },
  { action: 'orders:update', module: 'orders', description: 'Gerenciar pedidos' },
  { action: 'orders:cancel', module: 'orders', description: 'Cancelar pedidos' },

  // Invoices
  { action: 'invoices:read', module: 'invoices', description: 'Ver faturas' },
  { action: 'invoices:create', module: 'invoices', description: 'Criar faturas' },
  { action: 'invoices:update', module: 'invoices', description: 'Editar faturas' },
  { action: 'invoices:cancel', module: 'invoices', description: 'Cancelar faturas' },
  { action: 'invoices:refund', module: 'invoices', description: 'Emitir reembolsos' },

  // Payments
  { action: 'payments:read', module: 'payments', description: 'Ver pagamentos' },
  { action: 'payments:manage', module: 'payments', description: 'Gerenciar pagamentos' },

  // Services
  { action: 'services:read', module: 'services', description: 'Ver serviços' },
  { action: 'services:manage', module: 'services', description: 'Gerenciar serviços' },
  { action: 'services:suspend', module: 'services', description: 'Suspender serviços' },
  { action: 'services:terminate', module: 'services', description: 'Encerrar serviços' },

  // Domains
  { action: 'domains:read', module: 'domains', description: 'Ver domínios' },
  { action: 'domains:manage', module: 'domains', description: 'Gerenciar domínios' },

  // Support
  { action: 'support:read', module: 'support', description: 'Ver tickets de suporte' },
  { action: 'support:reply', module: 'support', description: 'Responder tickets' },
  { action: 'support:manage', module: 'support', description: 'Gerenciar departamentos e SLA' },
  { action: 'support:close', module: 'support', description: 'Fechar tickets' },

  // Reports
  { action: 'reports:read', module: 'reports', description: 'Ver relatórios' },
  { action: 'reports:export', module: 'reports', description: 'Exportar relatórios' },

  // Audit
  { action: 'audit:read', module: 'audit', description: 'Ver logs de auditoria' },

  // Integrations
  { action: 'integrations:read', module: 'integrations', description: 'Ver integrações' },
  { action: 'integrations:manage', module: 'integrations', description: 'Configurar integrações' },

  // Settings
  { action: 'settings:read', module: 'settings', description: 'Ver configurações' },
  { action: 'settings:manage', module: 'settings', description: 'Editar configurações' },

  // Automations
  { action: 'automations:read', module: 'automations', description: 'Ver automações' },
  { action: 'automations:manage', module: 'automations', description: 'Criar e editar automações' },
  { action: 'automations:execute', module: 'automations', description: 'Executar automações' },
]

const ALL_PERMISSIONS = PERMISSIONS.map((p) => p.action)

const SYSTEM_ROLES = [
  {
    name: 'Proprietário',
    slug: 'owner',
    description: 'Acesso total a todos os recursos da plataforma',
    permissions: ALL_PERMISSIONS,
  },
  {
    name: 'Administrador',
    slug: 'admin',
    description: 'Acesso administrativo completo exceto exclusão de organização',
    permissions: ALL_PERMISSIONS.filter((p) => p !== 'organization:delete'),
  },
  {
    name: 'Financeiro',
    slug: 'financial',
    description: 'Gerencia cobranças, faturas e pagamentos',
    permissions: [
      'clients:read',
      'invoices:read', 'invoices:create', 'invoices:update', 'invoices:cancel', 'invoices:refund',
      'payments:read', 'payments:manage',
      'orders:read',
      'reports:read', 'reports:export',
    ],
  },
  {
    name: 'Suporte',
    slug: 'support',
    description: 'Atende tickets de clientes com contexto de serviços e faturas',
    permissions: [
      'clients:read',
      'services:read',
      'invoices:read',
      'orders:read',
      'support:read', 'support:reply', 'support:close',
      'domains:read',
    ],
  },
  {
    name: 'Técnico',
    slug: 'technical',
    description: 'Gerencia serviços e infraestrutura',
    permissions: [
      'clients:read',
      'services:read', 'services:manage', 'services:suspend',
      'domains:read', 'domains:manage',
      'support:read', 'support:reply',
      'integrations:read', 'integrations:manage',
    ],
  },
  {
    name: 'Comercial',
    slug: 'commercial',
    description: 'Gerencia clientes, pedidos e produtos',
    permissions: [
      'clients:read', 'clients:create', 'clients:update',
      'products:read',
      'orders:read', 'orders:create', 'orders:update',
      'invoices:read',
      'reports:read',
      'support:read',
    ],
  },
  {
    name: 'Visualizador',
    slug: 'viewer',
    description: 'Acesso somente leitura',
    permissions: [
      'clients:read',
      'products:read',
      'orders:read',
      'invoices:read',
      'services:read',
      'domains:read',
      'support:read',
      'reports:read',
    ],
  },
  {
    name: 'Cliente',
    slug: 'client',
    description: 'Acesso ao portal do cliente (área restrita)',
    permissions: [],
  },
]

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n')

  // ─── Permissions ───────────────────────────────────────────────────────────
  console.log('📋 Criando permissões...')
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action: perm.action },
      create: perm,
      update: { description: perm.description },
    })
  }
  console.log(`   ✅ ${PERMISSIONS.length} permissões criadas.\n`)

  // ─── System Roles ──────────────────────────────────────────────────────────
  console.log('🎭 Criando papéis do sistema...')
  for (const roleData of SYSTEM_ROLES) {
    const { permissions, ...roleInfo } = roleData

    // findFirst + conditional update/create ensures idempotency with nullable organizationId
    const existing = await prisma.role.findFirst({
      where: { slug: roleInfo.slug, isSystem: true, organizationId: null },
    })

    const role = existing
      ? await prisma.role.update({
          where: { id: existing.id },
          data: { name: roleInfo.name, description: roleInfo.description },
        })
      : await prisma.role.create({
          data: { ...roleInfo, isSystem: true, organizationId: null },
        })

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })

    for (const action of permissions) {
      const perm = await prisma.permission.findUnique({ where: { action } })
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          create: { roleId: role.id, permissionId: perm.id },
          update: {},
        })
      }
    }

    console.log(`   ✅ Papel "${roleInfo.name}" — ${permissions.length} permissões`)
  }

  // ─── Dev User & Org ────────────────────────────────────────────────────────
  console.log('\n👤 Criando usuário e organização de desenvolvimento...')
  const devUser = await prisma.user.upsert({
    where: { email: 'admin@nexano.dev' },
    create: {
      email: 'admin@nexano.dev',
      name: 'Admin Nexano',
      passwordHash: await bcrypt.hash('nexano@123', 12),
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
    update: {},
  })

  const devOrg = await prisma.organization.upsert({
    where: { slug: 'nexano-dev' },
    create: { name: 'Nexano (Dev)', slug: 'nexano-dev', plan: 'enterprise', status: 'ACTIVE' },
    update: {},
  })

  const ownerRole = await prisma.role.findFirst({ where: { slug: 'owner', isSystem: true } })

  await prisma.organizationUser.upsert({
    where: { organizationId_userId: { organizationId: devOrg.id, userId: devUser.id } },
    create: { organizationId: devOrg.id, userId: devUser.id, roleId: ownerRole?.id, status: 'ACTIVE' },
    update: {},
  })

  console.log('   ✅ admin@nexano.dev (senha: nexano@123)')
  console.log(`   ✅ Organização "Nexano (Dev)" (slug: nexano-dev)\n`)

  // ─── Sample Clients ────────────────────────────────────────────────────────
  console.log('👥 Criando clientes de exemplo...')
  const sampleClients = [
    { name: 'João Silva', email: 'joao@empresa.com.br', document: '123.456.789-00', documentType: 'CPF' as const, type: 'INDIVIDUAL' as const, phone: '(11) 99999-0001', status: 'ACTIVE' as const },
    { name: 'TechBrasil Ltda', email: 'contato@techbrasil.com.br', document: '12.345.678/0001-90', documentType: 'CNPJ' as const, type: 'COMPANY' as const, phone: '(11) 3333-0001', status: 'ACTIVE' as const },
    { name: 'Maria Souza', email: 'maria@hotmail.com', document: '987.654.321-00', documentType: 'CPF' as const, type: 'INDIVIDUAL' as const, phone: '(21) 98888-0002', status: 'ACTIVE' as const },
    { name: 'Agência Digital', email: 'admin@agenciadigital.io', document: '98.765.432/0001-10', documentType: 'CNPJ' as const, type: 'COMPANY' as const, phone: '(31) 2222-0003', status: 'SUSPENDED' as const },
  ]

  for (const client of sampleClients) {
    await prisma.client.upsert({
      where: { organizationId_email: { organizationId: devOrg.id, email: client.email } },
      create: { ...client, organizationId: devOrg.id },
      update: {},
    })
  }
  console.log(`   ✅ ${sampleClients.length} clientes criados\n`)

  // ─── Client Portal User Accounts ──────────────────────────────────────────
  console.log('🌐 Criando usuários do portal do cliente...')
  const clientRole = await prisma.role.findFirst({ where: { slug: 'client', isSystem: true } })

  const portalUsers = [
    { name: 'João Silva', email: 'joao@empresa.com.br', password: 'Cliente@123' },
    { name: 'Maria Souza', email: 'maria@hotmail.com', password: 'Cliente@123' },
  ]

  for (const pu of portalUsers) {
    const portalUser = await prisma.user.upsert({
      where: { email: pu.email },
      create: {
        email: pu.email,
        name: pu.name,
        passwordHash: await bcrypt.hash(pu.password, 12),
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
      },
      update: {},
    })

    await prisma.organizationUser.upsert({
      where: { organizationId_userId: { organizationId: devOrg.id, userId: portalUser.id } },
      create: {
        organizationId: devOrg.id,
        userId: portalUser.id,
        roleId: clientRole?.id,
        status: 'ACTIVE',
      },
      update: {},
    })

    console.log(`   ✅ ${pu.email} (senha: ${pu.password})`)
  }
  console.log()

  // ─── Sample Categories & Products ─────────────────────────────────────────
  console.log('📦 Criando categorias e produtos de exemplo...')

  const categories = [
    { name: 'Hospedagem', slug: 'hospedagem', icon: 'server', sortOrder: 1 },
    { name: 'VPS & Cloud', slug: 'vps-cloud', icon: 'cpu', sortOrder: 2 },
    { name: 'Domínios', slug: 'dominios', icon: 'globe', sortOrder: 3 },
    { name: 'E-mail', slug: 'email', icon: 'mail', sortOrder: 4 },
  ]

  const createdCategories: Record<string, string> = {}
  for (const cat of categories) {
    const created = await prisma.productCategory.upsert({
      where: { organizationId_slug: { organizationId: devOrg.id, slug: cat.slug } },
      create: { ...cat, organizationId: devOrg.id },
      update: {},
    })
    createdCategories[cat.slug] = created.id
  }

  const products = [
    {
      name: 'Hospedagem Compartilhada',
      slug: 'hospedagem-compartilhada',
      type: 'HOSTING' as const,
      categoryId: createdCategories['hospedagem'],
      description: 'Hospedagem cPanel com recursos ilimitados',
      features: ['cPanel', 'SSL Grátis', 'WordPress 1-click', 'Backups diários'],
      plans: [
        {
          name: 'Starter',
          slug: 'hosting-starter',
          features: ['10 GB SSD', '1 site', '10 contas de e-mail'],
          limits: { storage: 10, sites: 1, emails: 10, bandwidth: 100 },
          prices: [
            { cycle: 'MONTHLY', amount: '19.90', isDefault: true },
            { cycle: 'ANNUAL', amount: '179.90', setupFee: '0' },
          ],
        },
        {
          name: 'Business',
          slug: 'hosting-business',
          isPopular: true,
          features: ['50 GB SSD', '5 sites', '50 contas de e-mail', 'Backups diários'],
          limits: { storage: 50, sites: 5, emails: 50, bandwidth: 500 },
          prices: [
            { cycle: 'MONTHLY', amount: '39.90', isDefault: true },
            { cycle: 'ANNUAL', amount: '359.90' },
          ],
        },
        {
          name: 'Pro',
          slug: 'hosting-pro',
          features: ['200 GB SSD', 'Sites ilimitados', 'E-mails ilimitados', 'CDN incluso'],
          limits: { storage: 200, sites: -1, emails: -1, bandwidth: -1 },
          prices: [
            { cycle: 'MONTHLY', amount: '79.90', isDefault: true },
            { cycle: 'ANNUAL', amount: '719.90' },
          ],
        },
      ],
    },
    {
      name: 'VPS Linux',
      slug: 'vps-linux',
      type: 'VPS' as const,
      categoryId: createdCategories['vps-cloud'],
      description: 'Servidores VPS com KVM e SSD NVMe',
      features: ['KVM', 'SSD NVMe', 'IPv4 dedicado', 'Painel de controle'],
      plans: [
        {
          name: 'VPS-1',
          slug: 'vps-1',
          features: ['1 vCPU', '2 GB RAM', '40 GB SSD NVMe', '1 TB Transfer'],
          limits: { vcpu: 1, ram: 2, storage: 40, transfer: 1024 },
          prices: [
            { cycle: 'MONTHLY', amount: '49.90', isDefault: true },
            { cycle: 'ANNUAL', amount: '479.90' },
          ],
        },
        {
          name: 'VPS-2',
          slug: 'vps-2',
          isPopular: true,
          features: ['2 vCPU', '4 GB RAM', '80 GB SSD NVMe', '2 TB Transfer'],
          limits: { vcpu: 2, ram: 4, storage: 80, transfer: 2048 },
          prices: [
            { cycle: 'MONTHLY', amount: '89.90', isDefault: true },
            { cycle: 'ANNUAL', amount: '859.90' },
          ],
        },
      ],
    },
  ]

  for (const prod of products) {
    const { plans, ...productData } = prod

    const product = await prisma.product.upsert({
      where: { organizationId_slug: { organizationId: devOrg.id, slug: prod.slug } },
      create: { ...productData, organizationId: devOrg.id },
      update: {},
    })

    for (const planData of plans) {
      const { prices, ...planInfo } = planData

      const existingPlan = await prisma.plan.findUnique({
        where: { organizationId_slug: { organizationId: devOrg.id, slug: planInfo.slug } },
      })

      const plan = existingPlan
        ? await prisma.plan.update({ where: { id: existingPlan.id }, data: planInfo })
        : await prisma.plan.create({ data: { ...planInfo, organizationId: devOrg.id, productId: product.id } })

      for (const price of prices) {
        await prisma.planPrice.upsert({
          where: { planId_currency_cycle: { planId: plan.id, currency: 'BRL', cycle: price.cycle as any } },
          create: {
            planId: plan.id,
            currency: 'BRL',
            cycle: price.cycle as any,
            amount: price.amount,
            setupFee: ((price as any).setupFee ?? '0') as unknown as any,
            isDefault: (price as any).isDefault ?? false,
            trialDays: (price as any).trialDays ?? 0,
          },
          update: { amount: price.amount },
        })
      }
    }

    console.log(`   ✅ Produto "${prod.name}" com ${plans.length} planos`)
  }

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\n📌 Admin:')
  console.log('   E-mail:  admin@nexano.dev')
  console.log('   Senha:   nexano@123')
  console.log('\n📌 Portal do Cliente:')
  console.log('   E-mail:  joao@empresa.com.br')
  console.log('   Senha:   Cliente@123')
  console.log('   ---')
  console.log('   E-mail:  maria@hotmail.com')
  console.log('   Senha:   Cliente@123')
  console.log('\n   API:     http://localhost:3001/api/v1')
  console.log('   Web:     http://localhost:3000')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
