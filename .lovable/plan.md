

# Plano: Alertas Automáticos de Renovação (Cron Diário)

## O que já existe
- Tabela `plan_renewal_requests`, edge function `generate-renewal-proposal`, página `/renovar/:token`
- Dashboard com widgets "Planos Vencendo" e "Renovações em Andamento"
- Configurações de renovação em Minha Empresa (toggles WhatsApp/Email, template, validade)

## O que falta implementar

### 1. Tabela `notification_logs` (anti-duplicidade)
Registra cada envio de alerta para evitar duplicatas por cliente/vencimento/canal.

```sql
CREATE TABLE notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  client_id uuid NOT NULL,
  type text NOT NULL,          -- 'plan_renewal'
  channel text NOT NULL,       -- 'whatsapp' | 'email'
  target text,                 -- telefone ou email
  plan_end_date date NOT NULL,
  status text DEFAULT 'sent',  -- sent | failed
  error_message text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, client_id, type, channel, plan_end_date)
);
```
RLS: select/insert para admin e financeiro da org.

### 2. Campos adicionais em `company_profile`
```sql
ALTER TABLE company_profile
  ADD COLUMN renewal_alert_enabled boolean DEFAULT true,
  ADD COLUMN renewal_alert_days integer DEFAULT 7,
  ADD COLUMN renewal_whatsapp_template text DEFAULT '...',
  ADD COLUMN renewal_email_template text DEFAULT '...';
```
Templates com variáveis: `{cliente_nome}`, `{plano_nome}`, `{data_vencimento}`, `{dias_restantes}`, `{valor_mensalidade}`, `{link_renovacao}`, `{nome_empresa}`.

### 3. Edge Function `send-plan-renewal-alerts`
Cron diário que:
1. Busca todas as orgs com `renewal_alert_enabled = true`
2. Para cada org, busca clientes ativos com `plan_end_date` entre hoje e hoje + `renewal_alert_days` dias, com `billing_plan` in (trimestral, semestral, anual)
3. Verifica `notification_logs` para evitar duplicatas
4. Para cada cliente sem log:
   - Gera `link_renovacao` usando `portal_token` do cliente
   - Monta mensagem com template
   - Registra em `notification_logs` (WhatsApp/Email)
   - Se WhatsApp: registra URL `wa.me/` (modo simples, sem envio automático real)
   - Se Email: placeholder (registra log)
5. Retorna resumo de envios

### 4. Cron Job (pg_cron)
Agendar execução diária às 08:00 via `cron.schedule`.

### 5. UI: Configurações de Alertas
Expandir a aba "Renovação" em MinhaEmpresa com:
- Toggle "Ativar alertas automáticos"
- Campo "Dias de antecedência" (default 7)
- Template WhatsApp (com variáveis expandidas)
- Template Email (com variáveis expandidas)

### 6. UI: Dashboard - Histórico de Alertas
Adicionar ao widget RenovacoesCard uma seção mostrando alertas enviados recentes (últimos 10 do `notification_logs`).

## Arquivos

**Criar:**
- `supabase/functions/send-plan-renewal-alerts/index.ts`

**Editar:**
- `src/components/configuracoes/MinhaEmpresa.tsx` — seção alertas expandida
- `src/pages/Dashboard.tsx` — integrar logs de alertas
- `supabase/config.toml` — registrar nova edge function

## Ordem
1. Migração DB (notification_logs + campos company_profile)
2. Edge function send-plan-renewal-alerts
3. Cron job pg_cron
4. UI configurações + dashboard

