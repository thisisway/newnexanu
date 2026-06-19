# 02 — Arquitetura Técnica

## Objetivo técnico

Construir o Nexano com uma arquitetura modular, segura, escalável, multi-tenant e preparada para integrações, automações e provisionamento assíncrono.

## Stack recomendada

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Componentes próprios ou shadcn/ui/Radix UI
- TanStack Query
- Zustand ou estado leve equivalente
- Design tokens centralizados
- Suporte completo a modo claro e escuro

### Backend

Opções recomendadas:

- Laravel 11+
- NestJS

Para acelerar o MVP, a sugestão principal é:

> Laravel + PostgreSQL + Redis + Next.js

### Banco de dados

- PostgreSQL
- UUID ou ULID para identificadores públicos
- `organization_id` em todas as tabelas multi-tenant

### Cache e filas

- Redis
- Laravel Horizon, BullMQ ou equivalente
- Jobs assíncronos para pagamentos, e-mails, provisionamento e webhooks

### Busca

- Meilisearch para MVP
- OpenSearch para cenários mais avançados

### Storage

- S3 compatível
- Separação por organização
- URLs temporárias para arquivos sensíveis

### Observabilidade

- Logs estruturados
- Audit logs
- Métricas de jobs
- Status de integrações
- Rastreamento de falhas de provisionamento

## Arquitetura modular

Módulos internos:

1. Identity
2. Organizations
3. Clients
4. Catalog
5. Orders
6. Billing
7. Payments
8. Services
9. Provisioning
10. Domains
11. DNS
12. Support
13. Notifications
14. Automation
15. Cloud Deploy
16. Reports
17. Integrations
18. Audit
19. Settings

No início, pode ser um monólito modular. Com o crescimento, módulos críticos podem virar serviços separados.

## Multi-tenant

Toda entidade pertencente a uma empresa deve conter `organization_id`.

Regras:

- Usuários administrativos pertencem a uma ou mais organizações.
- Clientes finais pertencem a uma organização.
- Produtos, faturas, serviços e tickets pertencem a uma organização.
- Integrações e chaves são isoladas por organização.
- Nunca vazar dados entre tenants.

## Segurança

Recursos obrigatórios:

- 2FA para administradores
- RBAC granular
- Criptografia de tokens e secrets
- Rate limit
- Proteção contra brute force
- Assinatura de webhooks
- Audit logs em ações sensíveis
- Sessões seguras
- Confirmação para ações destrutivas
- Logs de IP e user-agent
- Backup automático

## Eventos internos

O sistema deve ser orientado a eventos.

Exemplos:

- `order.created`
- `payment.approved`
- `invoice.overdue`
- `service.provisioning_started`
- `service.provisioning_failed`
- `service.activated`
- `ticket.created`
- `domain.expiring_soon`

Esses eventos alimentam automações, notificações, logs, timelines e webhooks.

## Jobs assíncronos

Jobs principais:

- Enviar e-mails
- Enviar WhatsApp
- Processar pagamento
- Consultar status de pagamento
- Criar serviço
- Suspender serviço
- Reativar serviço
- Registrar domínio
- Atualizar DNS
- Executar automações
- Enviar webhooks
- Sincronizar integrações

Cada job deve ter:

- Status
- Tentativas
- Erro amigável
- Erro técnico
- Logs
- Relação com entidade afetada
