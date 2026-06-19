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
  { action: 'clients:write', module: 'clients', description: 'Criar e editar clientes' },
  { action: 'clients:delete', module: 'clients', description: 'Excluir clientes' },
  { action: 'clients:impersonate', module: 'clients', description: 'Acessar como cliente' },

  // Products
  { action: 'products:read', module: 'products', description: 'Ver produtos' },
  { action: 'products:write', module: 'products', description: 'Criar e editar produtos' },
  { action: 'products:delete', module: 'products', description: 'Excluir produtos' },

  // Orders
  { action: 'orders:read', module: 'orders', description: 'Ver pedidos' },
  { action: 'orders:write', module: 'orders', description: 'Gerenciar pedidos' },
  { action: 'orders:cancel', module: 'orders', description: 'Cancelar pedidos' },

  // Invoices
  { action: 'invoices:read', module: 'invoices', description: 'Ver faturas' },
  { action: 'invoices:write', module: 'invoices', description: 'Criar e editar faturas' },
  { action: 'invoices:cancel', module: 'invoices', description: 'Cancelar faturas' },
  { action: 'invoices:refund', module: 'invoices', description: 'Emitir reembolsos' },

  // Payments
  { action: 'payments:read', module: 'payments', description: 'Ver pagamentos' },
  { action: 'payments:write', module: 'payments', description: 'Gerenciar pagamentos' },

  // Services
  { action: 'services:read', module: 'services', description: 'Ver serviços' },
  { action: 'services:write', module: 'services', description: 'Gerenciar serviços' },
  { action: 'services:suspend', module: 'services', description: 'Suspender serviços' },
  { action: 'services:terminate', module: 'services', description: 'Encerrar serviços' },

  // Domains
  { action: 'domains:read', module: 'domains', description: 'Ver domínios' },
  { action: 'domains:write', module: 'domains', description: 'Gerenciar domínios' },

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
  { action: 'settings:write', module: 'settings', description: 'Editar configurações' },

  // Automations
  { action: 'automations:read', module: 'automations', description: 'Ver automações' },
  { action: 'automations:write', module: 'automations', description: 'Criar e editar automações' },
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
      'invoices:read',
      'invoices:write',
      'invoices:cancel',
      'invoices:refund',
      'payments:read',
      'payments:write',
      'orders:read',
      'reports:read',
      'reports:export',
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
      'support:read',
      'support:reply',
      'support:close',
      'domains:read',
    ],
  },
  {
    name: 'Técnico',
    slug: 'technical',
    description: 'Gerencia serviços e infraestrutura',
    permissions: [
      'clients:read',
      'services:read',
      'services:write',
      'services:suspend',
      'domains:read',
      'domains:write',
      'support:read',
      'support:reply',
      'integrations:read',
      'integrations:manage',
    ],
  },
  {
    name: 'Comercial',
    slug: 'commercial',
    description: 'Gerencia clientes, pedidos e produtos',
    permissions: [
      'clients:read',
      'clients:write',
      'products:read',
      'orders:read',
      'orders:write',
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
]

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n')

  console.log('📋 Criando permissões...')
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action: perm.action },
      create: perm,
      update: { description: perm.description },
    })
  }
  console.log(`   ✅ ${PERMISSIONS.length} permissões criadas.\n`)

  console.log('🎭 Criando papéis do sistema...')
  for (const roleData of SYSTEM_ROLES) {
    const { permissions, ...roleInfo } = roleData

    const role = await prisma.role.upsert({
      where: { organizationId_slug: { organizationId: '', slug: roleInfo.slug } },
      create: {
        ...roleInfo,
        isSystem: true,
        organizationId: null,
      },
      update: {
        name: roleInfo.name,
        description: roleInfo.description,
      },
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

  console.log('\n👤 Criando usuário admin de desenvolvimento...')
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
    create: {
      name: 'Nexano (Dev)',
      slug: 'nexano-dev',
      plan: 'enterprise',
      status: 'ACTIVE',
    },
    update: {},
  })

  const ownerRole = await prisma.role.findFirst({
    where: { slug: 'owner', isSystem: true },
  })

  await prisma.organizationUser.upsert({
    where: {
      organizationId_userId: {
        organizationId: devOrg.id,
        userId: devUser.id,
      },
    },
    create: {
      organizationId: devOrg.id,
      userId: devUser.id,
      roleId: ownerRole?.id,
      status: 'ACTIVE',
    },
    update: {},
  })

  console.log('   ✅ Usuário admin@nexano.dev criado (senha: nexano@123)')
  console.log(`   ✅ Organização "Nexano (Dev)" criada (slug: nexano-dev)\n`)

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
