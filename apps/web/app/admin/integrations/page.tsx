'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard, Globe, Server, Bell, Settings2, CheckCircle2,
  Circle, Trash2, X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  DrawerTitle, DrawerCloseButton,
} from '@/components/ui/drawer'

// ── Integration catalog ────────────────────────────────────────────────────

type FieldType = 'text' | 'password' | 'boolean'

interface IntegrationField {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  hint?: string
}

interface Integration {
  slug: string
  name: string
  description: string
  color: string
  abbr: string
  fields: IntegrationField[]
}

const CATALOG: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; items: Integration[] }[] = [
  {
    id: 'payment',
    label: 'Gateways de Pagamento',
    icon: CreditCard,
    items: [
      {
        slug: 'mercadopago',
        name: 'Mercado Pago',
        description: 'Gateway líder na América Latina. PIX, boleto, cartão e mais.',
        color: '#009EE3',
        abbr: 'MP',
        fields: [
          { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'APP_USR-...' },
          { key: 'publicKey', label: 'Public Key', type: 'text', placeholder: 'APP_USR-...' },
          { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: '' },
        ],
      },
      {
        slug: 'stripe',
        name: 'Stripe',
        description: 'Plataforma global para pagamentos online e assinaturas.',
        color: '#635BFF',
        abbr: 'St',
        fields: [
          { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' },
          { key: 'publishableKey', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...' },
          { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...' },
        ],
      },
      {
        slug: 'pagseguro',
        name: 'PagSeguro',
        description: 'Gateway brasileiro com boleto, PIX e parcelamento.',
        color: '#00b33c',
        abbr: 'PS',
        fields: [
          { key: 'token', label: 'Token', type: 'password', placeholder: '' },
          { key: 'sandbox', label: 'Usar ambiente sandbox', type: 'boolean' },
        ],
      },
      {
        slug: 'paypal',
        name: 'PayPal',
        description: 'Aceite pagamentos internacionais em mais de 200 países.',
        color: '#003087',
        abbr: 'PP',
        fields: [
          { key: 'clientId', label: 'Client ID', type: 'text', placeholder: '' },
          { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: '' },
          { key: 'sandbox', label: 'Usar ambiente sandbox', type: 'boolean' },
        ],
      },
    ],
  },
  {
    id: 'domains',
    label: 'Registradores de Domínio',
    icon: Globe,
    items: [
      {
        slug: 'registrobr',
        name: 'Registro.br',
        description: 'Registre e gerencie domínios .br diretamente pelo painel.',
        color: '#1a6fb5',
        abbr: 'Rb',
        fields: [
          { key: 'user', label: 'Usuário', type: 'text', placeholder: '' },
          { key: 'password', label: 'Senha', type: 'password', placeholder: '' },
        ],
      },
      {
        slug: 'godaddy',
        name: 'GoDaddy',
        description: 'Gerencie domínios GoDaddy via API REST oficial.',
        color: '#1bdbdb',
        abbr: 'GD',
        fields: [
          { key: 'apiKey', label: 'API Key', type: 'password', placeholder: '' },
          { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: '' },
          { key: 'sandbox', label: 'Usar ambiente sandbox', type: 'boolean' },
        ],
      },
      {
        slug: 'cloudflare',
        name: 'Cloudflare',
        description: 'Gerencie DNS e ative proteção Cloudflare automaticamente.',
        color: '#F38020',
        abbr: 'CF',
        fields: [
          { key: 'apiToken', label: 'API Token', type: 'password', placeholder: '' },
          { key: 'accountId', label: 'Account ID', type: 'text', placeholder: '' },
        ],
      },
    ],
  },
  {
    id: 'hosting',
    label: 'Painéis de Hospedagem',
    icon: Server,
    items: [
      {
        slug: 'cpanel',
        name: 'cPanel / WHM',
        description: 'Provisione contas de hospedagem automaticamente via WHM API.',
        color: '#FF6C2F',
        abbr: 'cP',
        fields: [
          { key: 'host', label: 'Host WHM', type: 'text', placeholder: 'https://servidor:2087', hint: 'URL completa com porta' },
          { key: 'username', label: 'Usuário', type: 'text', placeholder: 'root' },
          { key: 'token', label: 'API Token', type: 'password', placeholder: '' },
        ],
      },
      {
        slug: 'plesk',
        name: 'Plesk',
        description: 'Crie e gerencie hospedagem Plesk de forma automatizada.',
        color: '#52B0E7',
        abbr: 'Pl',
        fields: [
          { key: 'host', label: 'Host Plesk', type: 'text', placeholder: 'https://plesk.exemplo.com:8443' },
          { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: '' },
        ],
      },
      {
        slug: 'directadmin',
        name: 'DirectAdmin',
        description: 'Integração com painéis DirectAdmin para provisionamento automático.',
        color: '#4A90D9',
        abbr: 'DA',
        fields: [
          { key: 'host', label: 'Host', type: 'text', placeholder: 'https://servidor:2222' },
          { key: 'username', label: 'Usuário', type: 'text', placeholder: '' },
          { key: 'password', label: 'Senha', type: 'password', placeholder: '' },
        ],
      },
    ],
  },
  {
    id: 'notifications',
    label: 'Notificações',
    icon: Bell,
    items: [
      {
        slug: 'telegram',
        name: 'Telegram',
        description: 'Receba alertas de novos pedidos e pagamentos no Telegram.',
        color: '#26A5E4',
        abbr: 'Tg',
        fields: [
          { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: '123456:ABC...', hint: 'Obtenha via @BotFather' },
          { key: 'chatId', label: 'Chat ID', type: 'text', placeholder: '-100123456789' },
        ],
      },
      {
        slug: 'slack',
        name: 'Slack',
        description: 'Envie notificações automáticas para canais do Slack.',
        color: '#4A154B',
        abbr: 'Sl',
        fields: [
          { key: 'webhookUrl', label: 'Incoming Webhook URL', type: 'password', placeholder: 'https://hooks.slack.com/...' },
          { key: 'channel', label: 'Canal padrão', type: 'text', placeholder: '#geral' },
        ],
      },
      {
        slug: 'zapiwhatsapp',
        name: 'WhatsApp via Z-API',
        description: 'Envie mensagens automáticas pelo WhatsApp usando Z-API.',
        color: '#25D366',
        abbr: 'WA',
        fields: [
          { key: 'instanceId', label: 'Instance ID', type: 'text', placeholder: '' },
          { key: 'token', label: 'Token', type: 'password', placeholder: '' },
        ],
      },
    ],
  },
]

const MASKED = '••••••••'
const SECRET_PATTERNS = ['key', 'token', 'secret', 'password', 'pass', 'webhookurl']

function isSecretField(name: string) {
  const lower = name.toLowerCase()
  return SECRET_PATTERNS.some((p) => lower.includes(p))
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [configs, setConfigs] = useState<Record<string, Record<string, unknown>>>({})
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Integration | null>(null)
  const [formData, setFormData] = useState<Record<string, string | boolean>>({})
  const [originalMasked, setOriginalMasked] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/integrations')
      setConfigs(res.data?.data ?? res.data ?? {})
    } catch { /* noop */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openConfigure(integration: Integration) {
    const existing = configs[integration.slug] ?? {}
    const form: Record<string, string | boolean> = {}
    const masked: Record<string, boolean> = {}

    for (const field of integration.fields) {
      if (field.type === 'boolean') {
        form[field.key] = (existing[field.key] as boolean) ?? false
      } else {
        const val = (existing[field.key] as string) ?? ''
        if (val === MASKED) {
          form[field.key] = ''
          masked[field.key] = true
        } else {
          form[field.key] = val
        }
      }
    }

    setFormData(form)
    setOriginalMasked(masked)
    setOpen(integration)
  }

  async function handleSave() {
    if (!open) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      for (const field of open.fields) {
        if (field.type === 'boolean') {
          payload[field.key] = formData[field.key] ?? false
        } else {
          const val = formData[field.key] as string
          payload[field.key] = (val === '' && originalMasked[field.key]) ? MASKED : val
        }
      }
      payload.enabled = true
      await api.put(`/admin/integrations/${open.slug}`, payload)
      await load()
      setOpen(null)
    } finally { setSaving(false) }
  }

  async function handleDisconnect(slug: string) {
    if (!confirm('Desconectar esta integração? As credenciais serão removidas.')) return
    setDisconnecting(slug)
    try {
      await api.delete(`/admin/integrations/${slug}`)
      await load()
    } finally { setDisconnecting(null) }
  }

  const isConfigured = (slug: string) => !!configs[slug]

  return (
    <div className="flex flex-col gap-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-h2 font-bold font-heading">Integrações</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Conecte o Nexano com gateways de pagamento, provedores e outros serviços.
        </p>
      </div>

      {/* Category sections */}
      {CATALOG.map((category) => {
        const Icon = category.icon
        return (
          <section key={category.id}>
            <div className="mb-4 flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">{category.label}</h2>
              <span className="ml-1 text-xs text-muted-foreground">
                ({category.items.filter((i) => isConfigured(i.slug)).length}/{category.items.length} configurados)
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.items.map((integration) => {
                const configured = isConfigured(integration.slug)
                return (
                  <div
                    key={integration.slug}
                    className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-md"
                  >
                    {/* Status dot */}
                    {configured && (
                      <span className="absolute right-4 top-4 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-50" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                      </span>
                    )}

                    {/* Logo + name */}
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm"
                        style={{ backgroundColor: integration.color }}
                      >
                        {integration.abbr}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{integration.name}</p>
                        <Badge
                          variant={configured ? 'success' : 'outline'}
                          className="mt-0.5 text-[10px] py-0"
                        >
                          {configured ? 'Configurado' : 'Não configurado'}
                        </Badge>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed">{integration.description}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-auto pt-1">
                      <Button
                        size="sm"
                        variant={configured ? 'outline' : 'default'}
                        className="flex-1 rounded-xl"
                        onClick={() => openConfigure(integration)}
                      >
                        <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                        {configured ? 'Editar' : 'Configurar'}
                      </Button>
                      {configured && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-danger border-danger/30 hover:bg-danger/5"
                          onClick={() => handleDisconnect(integration.slug)}
                          loading={disconnecting === integration.slug}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Configure Drawer */}
      <Drawer open={!!open} onOpenChange={(v) => { if (!v) setOpen(null) }}>
        <DrawerContent>
          <DrawerHeader>
            {open && (
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                  style={{ backgroundColor: open.color }}
                >
                  {open.abbr}
                </div>
                <DrawerTitle>Configurar {open.name}</DrawerTitle>
              </div>
            )}
            <DrawerCloseButton />
          </DrawerHeader>

          <DrawerBody className="space-y-4">
            {open?.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key} className="text-sm">
                  {field.label}
                </Label>

                {field.type === 'boolean' ? (
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-accent/50">
                    <input
                      type="checkbox"
                      id={field.key}
                      checked={Boolean(formData[field.key])}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, [field.key]: e.target.checked }))
                      }
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span className="text-sm text-foreground">
                      {field.label}
                    </span>
                  </label>
                ) : (
                  <Input
                    id={field.key}
                    type={field.type === 'password' ? 'password' : 'text'}
                    placeholder={
                      originalMasked[field.key]
                        ? 'Deixe em branco para manter atual'
                        : (field.placeholder ?? '')
                    }
                    value={formData[field.key] as string}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, [field.key]: e.target.value }))
                    }
                    className="rounded-xl"
                    autoComplete="off"
                  />
                )}

                {field.hint && (
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                )}
              </div>
            ))}

            {/* Status indicator */}
            {open && (
              <div className="rounded-xl border border-border p-3 flex items-start gap-2 text-xs text-muted-foreground">
                {isConfigured(open.slug) ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-px" />
                    <p>Esta integração já está configurada. Edite os campos acima para atualizar as credenciais.</p>
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4 shrink-0 mt-px" />
                    <p>Preencha os campos acima para ativar esta integração.</p>
                  </>
                )}
              </div>
            )}
          </DrawerBody>

          <DrawerFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpen(null)}
            >
              <X className="mr-2 h-3.5 w-3.5" />
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={handleSave} loading={saving}>
              Salvar integração
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
