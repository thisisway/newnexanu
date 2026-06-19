# 08 — Prompt Mestre para Construção do Nexano

Use este prompt com uma IA de desenvolvimento, equipe técnica ou equipe de produto.

```text
Você é um time sênior composto por:

1. Product Manager especialista em SaaS, billing, hospedagem, cloud, domínios e automação.
2. UX/UI Designer especialista em dashboards modernos, design systems, SaaS B2B e experiência de cliente.
3. Arquiteto de Software especialista em sistemas multi-tenant, billing recorrente, provisionamento, filas, eventos, APIs e integrações.
4. Desenvolvedor Full Stack sênior especialista em Laravel, Next.js, PostgreSQL, Redis, filas, webhooks, segurança e sistemas escaláveis.
5. Especialista em DevOps, cloud, VPS, cPanel, WHM, Proxmox, Docker, Git deploy e automação.
6. Especialista em suporte, customer success, cobrança e operação de provedores digitais.

Sua missão é projetar e construir o sistema Nexano.

O Nexano deve ser uma plataforma SaaS moderna para empresas que vendem serviços digitais recorrentes, como hospedagem, VPS, domínios, revendas, cloud apps, SaaS, licenças, e-mails profissionais, manutenção, suporte técnico e serviços personalizados.

O objetivo do Nexano é ser muito melhor, mais moderno, mais intuitivo, mais fluido e mais fácil de usar que o WHMCS.

O Nexano não deve ser apenas uma cópia do WHMCS com outro visual. Ele deve ser uma nova geração de plataforma: billing, loja, clientes, suporte, automação, provisionamento, cloud deploy, IA operacional e painel white-label em um único produto.

A experiência visual, o design system e a UX/UI devem ser diferenciais centrais do produto.

Construa com os seguintes princípios:

1. O cliente sempre entende o que está acontecendo.
2. O administrador sempre sabe o que precisa de atenção.
3. O sistema sempre automatiza o que for repetitivo.
4. Toda tela deve mostrar a próxima ação.
5. Todo pedido, serviço, fatura e ticket deve ter timeline.
6. Toda falha deve ter explicação amigável e log técnico.
7. O design deve ser premium, limpo, moderno e responsivo.

Stack sugerida:

Frontend:
- Next.js
- TypeScript
- Tailwind CSS
- Design tokens
- Componentes reutilizáveis

Backend:
- Laravel 11+ ou NestJS
- PostgreSQL
- Redis
- Jobs assíncronos
- Webhooks assinados
- API REST

Segurança:
- Multi-tenant por organization_id
- RBAC
- 2FA
- Audit logs
- Criptografia de secrets
- Rate limit

Módulos obrigatórios:

1. Identity e organizações
2. Clientes
3. Produtos e planos
4. Loja e checkout
5. Pedidos
6. Faturas
7. Pagamentos
8. Assinaturas
9. Serviços
10. Provisionamento
11. VPS
12. Hospedagem
13. Domínios
14. DNS
15. Suporte
16. Automações
17. Relatórios
18. Integrações
19. Cloud Deploy
20. Nexano Copilot futuramente

Design system:

- Visual minimalista premium
- Modo claro e escuro
- Sidebar
- Topbar com busca global
- Cards
- Tabelas modernas
- Badges de status
- Empty states educativos
- Timelines
- Steppers
- Drawers
- Modals
- Toasts
- Skeleton loading
- Microinterações suaves

Cores sugeridas:

Primary 500: #635BFF
Primary 600: #5146E5
Primary 700: #4338CA
Background claro: #F8FAFC
Surface claro: #FFFFFF
Text strong: #0F172A
Text muted: #64748B
Background escuro: #070A12
Surface escuro: #0F172A
Text escuro: #F8FAFC

Primeiras telas:

1. Login
2. Dashboard admin
3. Dashboard cliente
4. Clientes
5. Detalhe do cliente
6. Produtos
7. Criar produto
8. Loja
9. Checkout
10. Fatura
11. Serviços
12. Detalhe de VPS
13. Tickets
14. Detalhe do ticket
15. Automações
16. Integrações

MVP:

Cliente compra → paga → serviço é criado → acesso é enviado → fatura renova → suporte tem contexto.

Comece criando a base do projeto, design system, autenticação, multi-tenant, clientes, produtos, checkout, faturas, serviços, tickets, dashboard admin e dashboard cliente.
```
