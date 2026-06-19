# 05 — Módulos do Sistema

## 1. Identity e organizações

Recursos:

- Login
- Cadastro
- Recuperação de senha
- Verificação de e-mail
- 2FA
- Sessões ativas
- Dispositivos conectados
- Organizações
- Times
- Papéis e permissões
- Audit logs

Papéis padrão:

- Dono
- Administrador
- Financeiro
- Suporte
- Técnico
- Comercial
- Leitura
- Cliente final

## 2. Clientes

Visão 360º do cliente:

- Dados cadastrais
- Documento
- Endereço
- Contatos adicionais
- Serviços contratados
- Faturas
- Pedidos
- Tickets
- Domínios
- Notas internas
- Saldo em conta
- Tags
- Score de risco
- Histórico de atividades
- Logs de login

Ações rápidas:

- Criar fatura
- Criar serviço
- Abrir ticket
- Aplicar crédito
- Enviar cobrança
- Suspender serviços
- Acessar como cliente
- Adicionar nota interna

## 3. Catálogo de produtos

Tipos:

- Hospedagem
- WordPress
- VPS
- Cloud App
- Domínio
- Revenda
- E-mail profissional
- Licença
- Serviço manual
- Addon
- Backup
- SSL
- IP adicional
- Suporte premium
- Produto personalizado

Cada produto deve ter:

- Nome
- Descrição
- Categoria
- Ícone
- Status
- Visibilidade
- Ciclos de cobrança
- Preços
- Taxa de instalação
- Addons
- Campos personalizados
- Estoque opcional
- Módulo de provisionamento
- E-mail de boas-vindas
- Regras de suspensão
- Upgrades e downgrades

## 4. Pedidos e checkout

Fluxo:

1. Escolha do produto
2. Configuração
3. Identificação do cliente
4. Pagamento
5. Confirmação
6. Provisionamento
7. Tela de progresso

Cada pedido deve ter timeline.

## 5. Billing e faturas

Recursos:

- Faturas
- Itens de fatura
- Assinaturas
- Cobrança recorrente
- Pagamentos parciais
- Créditos
- Reembolsos
- Pró-rata
- Upgrade/downgrade
- Multimoeda
- Impostos
- Descontos
- Cupons
- Régua de cobrança
- Suspensão automática
- Reativação automática

Métodos prioritários:

- PIX
- Cartão recorrente
- Boleto
- Saldo em conta

## 6. Serviços

Tipos:

- Hospedagem
- VPS
- Domínio
- Cloud App
- E-mail
- Licença
- Revenda
- Serviço manual

Status:

- Pendente
- Provisionando
- Ativo
- Suspenso
- Cancelado
- Encerrado
- Com erro
- Expirado

Todo serviço deve ter timeline, faturas relacionadas e ações disponíveis.

## 7. VPS

Listagem:

- Nome
- Status
- IP principal
- Plano
- Sistema operacional
- Aplicação instalada
- CPU
- RAM
- Disco
- Tráfego
- Vencimento
- Alertas
- Ações rápidas

Ações:

- Ligar
- Desligar
- Reiniciar
- Console
- Reinstalar
- Alterar senha
- Criar snapshot
- Restaurar backup
- Upgrade
- Ver fatura
- Abrir suporte

## 8. Hospedagem e Sites

Assistente inicial:

- Criar site WordPress
- Criar loja virtual
- Hospedar site institucional
- Migrar site existente
- Conectar domínio
- Criar aplicação moderna
- Falar com especialista

## 9. Domínios e DNS

Recursos:

- Buscar domínio
- Registrar domínio
- Transferir domínio
- Renovar domínio
- Renovação automática
- Gerenciar DNS
- Alterar nameservers
- Bloquear transferência
- Alertas de vencimento
- Conectar domínio a serviço

## 10. Suporte

Recursos:

- Departamentos
- Prioridades
- Status
- SLA
- Mensagens
- Anexos
- Macros
- Notas internas
- Atribuição
- Tags
- Histórico
- Satisfação
- Base de conhecimento

Ticket admin deve mostrar contexto lateral:

- Cliente
- Serviços ativos
- Faturas em aberto
- Tickets anteriores
- Logs recentes
- Risco
- Sugestão de resposta
- Ações rápidas

## 11. Automações

Modelo:

> Quando algo acontecer → verificar condição → executar ação.

Gatilhos:

- Pedido criado
- Pagamento aprovado
- Pagamento recusado
- Fatura criada
- Fatura vencida
- Serviço provisionado
- Serviço com erro
- Serviço suspenso
- Ticket criado
- Ticket sem resposta
- Domínio próximo do vencimento

Ações:

- Enviar e-mail
- Enviar WhatsApp
- Criar ticket
- Suspender serviço
- Reativar serviço
- Criar fatura
- Aplicar tag
- Enviar webhook
- Notificar equipe

## 12. Cloud Deploy

Métodos:

- GitHub
- GitLab
- Upload ZIP
- Dockerfile
- Template pronto

Templates:

- n8n
- Chatwoot
- WordPress
- Laravel
- Next.js
- Node.js
- Python FastAPI
- Uptime Kuma
- EasyPanel
- API simples
- Landing page estática
