# 06 — Banco de Dados e API

## Entidades principais

```text
organizations
users
roles
permissions
organization_users
clients
client_contacts
client_notes
products
product_categories
plans
plan_prices
addons
orders
order_items
invoices
invoice_items
payments
payment_methods
subscriptions
services
service_metadata
service_events
provisioning_jobs
domains
dns_zones
dns_records
tickets
ticket_messages
ticket_notes
ticket_departments
ticket_slas
automation_flows
automation_triggers
automation_conditions
automation_actions
automation_runs
notifications
email_templates
webhooks
integrations
integration_logs
audit_logs
files
settings
```

## Regras de modelagem

- Usar `organization_id` em tabelas multi-tenant.
- Usar UUID ou ULID para identificadores públicos.
- Não expor IDs sequenciais em URLs públicas.
- Separar dados técnicos em `service_metadata` quando variam por tipo de serviço.
- Registrar eventos importantes em tabelas de timeline.
- Criptografar tokens, chaves, secrets e credenciais.

## API

Padrão de rotas:

```text
/api/v1/admin/...
/api/v1/client/...
/api/v1/public/...
/api/v1/webhooks/...
```

Recursos principais:

- Auth
- Organizations
- Users
- Clients
- Products
- Plans
- Orders
- Invoices
- Payments
- Subscriptions
- Services
- Domains
- DNS
- Tickets
- Automations
- Integrations
- Reports
- Audit Logs

## Requisitos da API

- Paginação
- Filtros
- Ordenação
- Rate limit
- Logs estruturados
- Validação forte
- Erros padronizados
- Documentação OpenAPI
- Webhooks assinados

## Exemplo de erro padronizado

```json
{
  "error": {
    "code": "SERVICE_PROVISIONING_FAILED",
    "message": "Não conseguimos criar o serviço automaticamente.",
    "details": "A integração retornou erro de autenticação.",
    "action": "Verifique as credenciais da integração e tente novamente."
  }
}
```

## Webhooks

Eventos sugeridos:

```text
order.created
order.paid
invoice.created
invoice.paid
invoice.overdue
payment.approved
payment.failed
service.created
service.provisioning_started
service.provisioning_failed
service.activated
service.suspended
service.unsuspended
domain.registered
domain.expiring_soon
ticket.created
ticket.replied
```

Todo webhook deve conter assinatura e timestamp para validação.

## Provisioning providers

Interface conceitual:

```text
create()
suspend()
unsuspend()
terminate()
upgrade()
sync()
getStatus()
```

Integrações iniciais recomendadas:

- cPanel/WHM
- Proxmox ou Virtualizor
- Cloudflare
- Mercado Pago ou Asaas
- E-mail transacional
- WhatsApp
