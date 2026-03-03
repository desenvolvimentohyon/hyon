

# Plano: Módulo de Automação Recorrente + Portal do Cliente

Este é um projeto extenso com 8 módulos distintos. Recomendo implementar em **4 fases** para manter estabilidade e permitir testes incrementais.

---

## Fase 1 — Infraestrutura de Banco de Dados

Criar todas as tabelas e colunas necessárias via migrações:

### Alterações na tabela `clients`:
- `portal_token` (text, unique) — token de acesso ao portal
- `adjustment_base_date` (date) — data base de reajuste
- `adjustment_type` (text) — tipo: `percentual_fixo`, `ipca`, `igpm`
- `adjustment_percent` (numeric, default 0)
- `health_score` (integer, default 100)
- `health_status` (text, default `verde`)

### Novas tabelas:

**`billing_notifications`** — histórico de notificações de cobrança
- id, org_id, client_id, title_id (FK financial_titles), type (text), channel (text), sent_at, created_at

**`billing_rules`** — configuração da régua de cobrança (1 por org)
- id, org_id, days_before (integer[]), on_due_day (boolean), days_after (integer[]), auto_email (boolean), auto_whatsapp (boolean), auto_task (boolean), created_at, updated_at

**`contract_adjustments`** — histórico de reajustes
- id, org_id, client_id, old_value, new_value, percent_applied, applied_at, created_at

**`upsell_suggestions`** — sugestões de upsell
- id, org_id, client_id, suggested_module_id (FK system_modules), status (text: pendente/contatado/vendido), created_at, updated_at

RLS em todas as tabelas: SELECT/INSERT/UPDATE com `org_id = current_org_id()` e roles adequados. Realtime habilitado para `billing_notifications`.

---

## Fase 2 — Portal do Cliente (rota pública `/portal/:token`)

### Backend:
- Edge Function `portal-data` que recebe o token, busca o cliente (sem autenticação), e retorna:
  - Dados do cliente, sistema, plano, mensalidade
  - Títulos financeiros (financial_titles) do cliente
  - Dados do certificado digital
  - Dados de contrato (data assinatura, data reajuste)
- Edge Function `generate-portal-token` (autenticada, admin/comercial) para gerar/regenerar token único por cliente

### Frontend:
- Nova página `src/pages/PortalCliente.tsx` na rota `/portal/:token` (fora do AuthGate)
- Seções: Dados do Cliente, Financeiro (lista de mensalidades com status e botões boleto/PIX), Contrato, Certificado Digital
- Design limpo, sem sidebar, com logo Hyon Tech
- Botão "Gerar Link Portal" no cadastro do cliente

---

## Fase 3 — Automações (Edge Functions + Cron)

### 3.1 Régua de Cobrança (`billing-cron`)
- Cron diário via pg_cron + pg_net
- Percorre financial_titles com status `aberto`, verifica dias até/após vencimento
- Compara com `billing_rules` da org
- Cria registros em `billing_notifications`
- Se atraso >= 7 dias, cria tarefa automática tipo "financeiro"
- Atualiza status para "vencido" quando due_at < hoje

### 3.2 Reajuste Automático (`adjustment-cron`)
- Cron mensal
- Busca clientes com `adjustment_base_date` no mês atual
- Aplica percentual, atualiza `monthly_value_final`
- Registra em `contract_adjustments` e `monthly_adjustments`
- Cria notificação interna

### 3.3 Health Score (`health-score-cron`)
- Cron semanal
- Calcula score 0-100 baseado em:
  - Títulos vencidos (-20 por título)
  - Chamados de suporte nos últimos 90 dias (-5 por chamado acima de 3)
  - Tempo como cliente (+10 por ano, máx 30)
  - Status cancelado anterior (-30)
- Atualiza `health_score` e `health_status` no cliente

### 3.4 Upsell Automático (`upsell-cron`)
- Cron semanal (junto com health score)
- Clientes ativos > 3 meses, health_score >= 70, sem todos os módulos
- Insere em `upsell_suggestions` se não existir pendente

### Configuração no `supabase/config.toml`:
- Desabilitar JWT para as crons (chamadas internas)
- Portal data também sem JWT

---

## Fase 4 — UI (telas e widgets)

### 4.1 Configurações Financeiras — Régua de Cobrança
- Adicionar seção em `ConfiguracoesFinanceiras.tsx`
- Campos: dias antes, no dia, dias após, switches para email/whatsapp/tarefa

### 4.2 Cadastro do Cliente — Campos de Reajuste
- Adicionar na tela de edição de cliente: data base, tipo reajuste, percentual
- Botão "Gerar Link Portal"

### 4.3 Dashboard — Widgets Executivos
- Adicionar ao final do Dashboard existente (sem alterar widgets atuais):
  - Clientes com atraso 7+ dias (já existe parcialmente)
  - Certificados vencendo em 15 dias
  - MRR com reajuste aplicado este mês
  - Crescimento MRR mês vs anterior
  - Top 5 clientes com health score vermelho
  - Oportunidades de upsell pendentes

### 4.4 Sidebar
- Adicionar link "Portal" na seção Gestão (para admin gerar tokens)

### 4.5 Checkout Interno (`/checkout-interno`)
- Wizard em etapas: Sistema → Plano → Desconto → Proposta → Cliente → Mensalidade
- Integra com tabelas existentes (proposals, clients, financial_titles)
- Opcional: disparo ASAAS se integração ativa

---

## Estimativa de Complexidade

| Fase | Itens | Complexidade |
|------|-------|-------------|
| 1 - DB | 5 tabelas + colunas | Média |
| 2 - Portal | 2 edge functions + 1 página | Média |
| 3 - Crons | 4 edge functions + pg_cron | Alta |
| 4 - UI | 5 alterações de tela + 1 nova | Média |

---

## Observações Técnicas

- Todas as tabelas com `org_id` e RLS restritivo
- Edge Functions de cron usam `SUPABASE_SERVICE_ROLE_KEY` (já configurado)
- Nenhuma tela existente será modificada estruturalmente — apenas adições
- Health score e upsell são cálculos server-side para consistência
- Portal é público (sem login) mas protegido por token UUID único

Recomendo começar pela **Fase 1** (migrações de banco) e avançar sequencialmente. Deseja aprovar para iniciar a implementação?

