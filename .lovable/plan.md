

# Plano: Reset de Dados Operacionais (Clean Slate)

## Situação Atual
Dados remanescentes no banco:
- **32 clientes** de teste
- **235 financial_titles** (contas a receber/pagar)
- **199 bank_transactions** (movimentos bancários)
- **63 monthly_adjustments** (ajustes mensalidade)
- **3 partners** (parceiros)
- Demais tabelas operacionais já estão zeradas

## O que será feito

### 1. Atualizar Edge Function `seed-org` para suportar `action: "reset"`
Adicionar novo modo que limpa **apenas dados operacionais** sem tocar em configurações.

Tabelas que serão limpas (em ordem de dependência FK):

**Wave 1** (folhas sem dependências):
- task_comments, task_history, proposal_items, bank_transactions
- monthly_adjustments, support_events, notification_logs, billing_notifications
- payment_receipts, client_attachments, client_contacts, contract_adjustments
- asaas_webhook_events, portal_tickets, portal_referrals
- card_commissions, card_revenue_monthly, card_proposal_onboarding, card_fee_profiles

**Wave 2** (nível intermediário):
- tasks, financial_titles, plan_renewal_requests, card_proposals

**Wave 3**: proposals

**Wave 4**: clients, partners, card_clients

### Tabelas PRESERVADAS (não tocadas):
- organizations, profiles (usuários)
- company_profile, company_bank_accounts (Minha Empresa)
- plans, payment_methods (configurações)
- systems_catalog, system_modules (sistemas/módulos)
- crm_statuses, custom_roles (CRM/permissões)
- plan_accounts, bank_accounts (plano de contas)
- billing_rules, asaas_settings, proposal_settings

### 2. Deploy e execução
- Deploy da edge function atualizada
- Chamar `POST /seed-org` com `{ "action": "reset" }`

### 3. Verificação
- Query de contagem em todas as tabelas operacionais = 0
- Navegar no dashboard para confirmar indicadores zerados

## Arquivos editados
- `supabase/functions/seed-org/index.ts` — adicionar bloco `action === "reset"`

