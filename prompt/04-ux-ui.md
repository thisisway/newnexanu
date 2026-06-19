# 04 — UX e UI

## Princípio principal

Toda tela deve responder:

1. O que está acontecendo?
2. O que precisa de atenção?
3. Qual é o próximo passo?
4. O que posso fazer agora?

## Estrutura padrão das telas

- Sidebar lateral
- Topbar com busca global
- Breadcrumb discreto
- Título claro
- Subtítulo explicativo
- Ação principal no canto superior direito
- Cards de resumo quando necessário
- Conteúdo principal
- Estados vazios educativos
- Loading, erro e sucesso bem tratados

## Painel do cliente

Menu recomendado:

```text
Início
Meus Serviços
Sites
VPS
Cloud Apps
Domínios
Faturas
Suporte
Loja
Configurações
```

### Home do cliente

A Home deve responder:

- Está tudo certo com minha conta?
- Tenho algo para pagar?
- Tenho algum serviço com problema?
- Qual é o próximo passo?
- Como peço ajuda?

Componentes:

- Saudação
- Status geral da conta
- Próxima ação
- Cards de serviços
- Faturas em aberto
- Tickets abertos
- Atalhos rápidos
- Avisos
- Recomendações úteis

Exemplo:

> Boa tarde, Wesley.  
> Sua conta está em dia.  
> Você tem 1 VPS sendo preparada.  
> Próximo passo: aguardar a instalação do EasyPanel.  
> Tempo estimado: 3 minutos.

## Painel administrativo

Menu recomendado:

```text
Visão Geral
Clientes
Pedidos
Serviços
Produtos
Faturas
Pagamentos
Domínios
Suporte
Automações
Relatórios
Loja
Integrações
Equipe
Configurações
```

Área técnica avançada:

```text
Provisionamento
Jobs
Webhooks
Logs
Servidores
Módulos
Auditoria
API
```

### Dashboard admin

Deve mostrar:

- MRR
- Receita do mês
- Faturas vencidas
- Novos pedidos
- Serviços ativos
- Serviços com erro
- Tickets abertos
- Tickets críticos
- Domínios expirando
- Churn
- Novos clientes

Seção essencial: **Precisa de atenção**.

Exemplos:

- “3 VPS travadas no provisionamento” → Ver jobs
- “12 faturas vencidas há mais de 5 dias” → Enviar cobrança
- “2 tickets críticos sem resposta” → Atender agora
- “4 domínios expiram em 7 dias” → Renovar

## Próxima ação

Cada entidade importante deve ter uma próxima ação.

Exemplos:

### Cliente
- Enviar cobrança
- Responder ticket
- Verificar pagamento recusado

### Serviço
- Aguardar provisionamento
- Configurar domínio
- Ativar SSL
- Pagar fatura para reativar

### Pedido
- Aprovar antifraude
- Reprocessar provisionamento

### Fatura
- Copiar PIX
- Enviar lembrete
- Baixar PDF

### Domínio
- Renovar domínio
- Configurar DNS

## Timeline universal

Toda entidade importante deve ter timeline:

- Cliente
- Pedido
- Fatura
- Serviço
- VPS
- Domínio
- Ticket
- Automação
- Job

A timeline deve mostrar:

- Data
- Hora
- Evento
- Responsável
- Status
- Detalhes
- Link para logs quando existir

## UX Writing

Usar linguagem simples, humana e objetiva.

### Exemplos

Ruim:

> Serviço pendente.

Bom:

> Estamos criando seu serviço. Isso pode levar alguns minutos.

Ruim:

> Fatura cancelada.

Bom:

> Esta fatura foi cancelada e não precisa ser paga.

Ruim:

> Domínio sem DNS.

Bom:

> Seu domínio ainda não está conectado a nenhum serviço.

Ruim:

> Provisionamento falhou.

Bom:

> Não conseguimos criar o serviço automaticamente. Nossa equipe já pode revisar isso.

## Mobile-first

No mobile:

- Sidebar vira bottom navigation ou menu compacto
- Cards empilham
- Tabelas viram listas
- Botões principais ficam fáceis de tocar
- Fatura deve permitir copiar PIX rapidamente
- Tickets devem parecer conversa
- Checkout deve ser extremamente simples

Priorizar:

- Pagar fatura
- Abrir suporte
- Ver status
- Copiar dados de acesso
- Reiniciar VPS
- Acompanhar pedido
