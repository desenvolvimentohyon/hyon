

# Plano: Módulo Gestão de Máquinas de Cartão

## Visao Geral

Novo módulo completo para gestão de clientes de maquininhas (fiscal/não fiscal), propostas com link público, faturamento mensal e comissões (30%). Separado dos módulos existentes, com tabelas próprias no banco.

## 1. Banco de Dados (6 migrações)

Criar as seguintes tabelas com RLS por `org_id` usando `current_org_id()`:

**card_clients** — Clientes da maquininha (campos conforme spec: name, company_name, cnpj, phone, email, city, status enum, card_machine_type enum, linked_client_id nullable FK clients.id, notes, org_id, timestamps)

**card_fee_profiles** — Taxas negociadas por cliente (mdr_debito, mdr_credito_1x/2a6/7a12, antecipacao, prazo_repasse, aluguel_mensal, active, card_client_id FK)

**card_proposals** — Propostas de maquininha (public_token unique, title, machine_type, commission_percent default 30, fee_profile_snapshot jsonb, validity_days, status enum draft/enviada/visualizada/aceita/recusada/expirada, sent_at, first_viewed_at, accepted_at, refused_at, accepted_by_name, card_client_id FK)

**card_proposal_onboarding** — Onboarding pós-aceite (card_proposal_id FK, card_client_id FK, status enum, data_payload jsonb, requested_at, completed_at)

**card_revenue_monthly** — Faturamento mensal manual (card_client_id FK, competency text, gross_volume numeric, notes. Unique: org_id + card_client_id + competency)

**card_commissions** — Comissões calculadas (card_client_id FK, competency, gross_volume, commission_percent default 30, commission_value, status enum previsto/confirmado/pago, paid_at. Unique: org_id + card_client_id + competency)

RLS: SELECT/INSERT/UPDATE/DELETE por org_id. Páginas públicas acessam via edge function com token.

## 2. Edge Functions

**card-public-proposal** — Acesso público por token (verify_jwt=false). GET retorna dados da proposta. POST para registrar visualização/aceite/onboarding.

## 3. Navegação

Adicionar módulo mãe **"Cartões"** (ícone: CreditCard) no `AppSidebar.tsx` com filhos:
- Clientes → `/cartoes/clientes`
- Propostas → `/cartoes/propostas`
- Faturamento → `/cartoes/faturamento`
- Dashboard → `/cartoes`

Adicionar permissões `cartoes:visualizar`, `cartoes:criar`, `cartoes:editar` em `MODULOS_PERMISSOES` e `ROTA_PERMISSAO`.

## 4. Rotas (App.tsx)

Dentro do `AppLayout`:
- `/cartoes` — Dashboard do módulo
- `/cartoes/clientes` — Lista de clientes maquininha
- `/cartoes/clientes/:id` — Detalhe com tabs (Dados, Taxas, Propostas, Faturamento, Comissão)
- `/cartoes/propostas` — Lista de propostas
- `/cartoes/faturamento` — Lançamento de faturamento + comissões

Rota pública (fora do AuthGate):
- `/cartoes/proposta/:token` — Página pública da proposta

## 5. Páginas e Componentes

### 5.1 Dashboard Cartões (`/cartoes`)
KPIs: Total faturamento mês, Comissão prevista, Leads sem proposta, Propostas aceitas mês, Onboarding pendente. Gráfico evolução mensal (linha). Top 10 clientes por faturamento.

### 5.2 Clientes Maquininha (`/cartoes/clientes`)
Tabela com filtros (status, tipo máquina). Ações rápidas: Criar proposta, Registrar faturamento, Vincular ao ERP. Dialog para novo cliente. Badge fiscal/não fiscal.

### 5.3 Detalhe Cliente (`/cartoes/clientes/:id`)
Tabs: Dados, Taxas (histórico de perfis), Propostas, Faturamento, Comissão. Ação "Vincular ao Cliente ERP" com busca por nome/CNPJ.

### 5.4 Propostas Maquininha (`/cartoes/propostas`)
Criar proposta: selecionar cliente, tipo máquina, carregar taxas ativas, comissão %, validade. Gerar link público + enviar WhatsApp. Tabela com status e tracking.

### 5.5 Página Pública (`/cartoes/proposta/:token`)
Design SaaS premium (mesmo padrão do PropostaPublica existente). Mostra tipo máquina, tabela de taxas, validade. Botões: Aceitar, WhatsApp, PDF. Tracking de visualização/aceite. Formulário de onboarding após aceite.

### 5.6 Faturamento & Comissão (`/cartoes/faturamento`)
Lançar por cliente + competência. Auto-calcula comissão (gross_volume * 30%). Tabs: Faturamento | Comissões. Marcar comissão como paga.

## 6. Widgets no Dashboard Geral

Adicionar card compacto no Dashboard principal: "Cartões — Comissão Prevista: R$ X | Leads: Y | Onboarding: Z" com link para `/cartoes`.

## 7. Segurança

- Todas as tabelas com RLS por org_id
- Página pública via edge function (sem acesso direto às tabelas)
- Permissões RBAC integradas ao sistema existente

## 8. Arquivos a Criar/Editar

**Criar:**
- `src/pages/cartoes/CardDashboard.tsx`
- `src/pages/cartoes/CardClientes.tsx`
- `src/pages/cartoes/CardClienteDetalhe.tsx`
- `src/pages/cartoes/CardPropostas.tsx`
- `src/pages/cartoes/CardFaturamento.tsx`
- `src/pages/cartoes/CardPropostaPublica.tsx`
- `src/hooks/useCardClients.ts` (CRUD com react-query)
- `src/hooks/useCardProposals.ts`
- `src/hooks/useCardRevenue.ts`
- `supabase/functions/card-public-proposal/index.ts`

**Editar:**
- `src/App.tsx` — Adicionar rotas
- `src/components/layout/AppSidebar.tsx` — Adicionar módulo Cartões
- `src/types/users.ts` — Adicionar permissões
- `src/pages/Dashboard.tsx` — Widget de comissão

## Ordem de Execução

1. Migração DB (todas as tabelas + RLS)
2. Edge function pública
3. Hooks de dados (react-query)
4. Sidebar + Rotas
5. Páginas: Clientes → Propostas → Faturamento → Dashboard Cartões
6. Página pública + onboarding
7. Widget no Dashboard geral
8. Permissões RBAC

