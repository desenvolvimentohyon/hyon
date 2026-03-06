

## Problem Analysis

The data persists because:
1. The `seed-org` Edge Function was invoked at 02:43 UTC today, re-inserting 32 clients and 235 financial titles
2. The "Importar Dados para o Cloud" and "Forçar Reimportação" buttons on the Configuracoes page allow anyone with admin access to re-seed all test data
3. Previous cleanup attempts were overwritten by subsequent seed invocations

## Plan

### 1. Delete all operational data (again) via SQL

Execute DELETE statements for org_id `ddf30680-ff6b-4941-a788-84f330d58391` in dependency order:
- Wave 1: leaf tables (task_comments, task_history, proposal_items, bank_transactions, monthly_adjustments, support_events, notification_logs, billing_notifications, payment_receipts, client_attachments, client_contacts, contract_adjustments, portal_tickets, portal_referrals, card_commissions, card_revenue_monthly, card_proposal_onboarding, card_fee_profiles, upsell_suggestions)
- Wave 2: intermediate tables (tasks, financial_titles, plan_renewal_requests, card_proposals)
- Wave 3: proposals
- Wave 4: root entities (clients, partners, card_clients)

### 2. Remove seed import UI from Configuracoes

Remove the entire "Importar Dados para o Cloud" card from `src/pages/Configuracoes.tsx` (lines ~270-313), including the `seedLoading` state variable and the `CloudUpload` import. This prevents accidental re-seeding.

### 3. Delete the seed-org Edge Function

Delete `supabase/functions/seed-org/index.ts` to eliminate the seed capability entirely from the backend.

### 4. Remove local seed data files

Delete the following files that contain hardcoded test data (they are no longer referenced after removing seed-org):
- `src/data/seed.ts`
- `src/data/seedFinanceiro.ts`
- `src/data/seedParametros.ts`
- `src/data/seedPropostas.ts`
- `src/data/seedReceita.ts`
- `src/data/seedUsers.ts`

Note: `seedConfigFinanceira` from `seedFinanceiro.ts` is imported in `FinanceiroContext.tsx` as default config -- this will need to be inlined before deletion.

