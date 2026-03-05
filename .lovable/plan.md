

# Plano: Renovação 1-Clique com Proposta Automática

## Visao Geral

Quando um plano estiver perto de vencer (ou manualmente), gerar proposta de renovação automaticamente usando a engine de propostas existente (`proposals`), com link público, envio WhatsApp/Email e aceite que renova a vigência.

## 1. Banco de Dados

### 1.1 Tabela `plan_renewal_requests`

```sql
CREATE TABLE public.plan_renewal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  renewal_for_end_date date NOT NULL,
  generated_proposal_id uuid REFERENCES proposals(id),
  proposal_public_token text,
  status text NOT NULL DEFAULT 'pendente',  -- pendente, proposta_enviada, aceita, recusada, expirada, concluido
  auto_generated boolean NOT NULL DEFAULT true,
  whatsapp_sent_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, client_id, renewal_for_end_date)
);
```

RLS por `org_id = current_org_id()`. INSERT/UPDATE para admin e financeiro.

### 1.2 Adicionar campos na `proposals`

```sql
ALTER TABLE proposals
  ADD COLUMN proposal_type text NOT NULL DEFAULT 'new_sale',  -- new_sale | renewal
  ADD COLUMN reference_end_date date;
```

### 1.3 Configurações de renovação na `company_profile`

```sql
ALTER TABLE company_profile
  ADD COLUMN renewal_auto_proposal boolean DEFAULT true,
  ADD COLUMN renewal_whatsapp boolean DEFAULT true,
  ADD COLUMN renewal_email boolean DEFAULT false,
  ADD COLUMN renewal_validity_days integer DEFAULT 7,
  ADD COLUMN renewal_same_plan boolean DEFAULT true,
  ADD COLUMN renewal_template text DEFAULT 'Olá {cliente}, segue sua proposta de renovação: {link}';
```

## 2. Edge Function: `generate-renewal-proposal`

Nova Edge Function (verify_jwt=false para chamadas do portal, mas validar internamente).

**Lógica:**
1. Recebe `client_id` + `renewal_for_end_date` (+ optional `org_id` from portal token)
2. Busca cliente (plano, valor, sistema, módulos)
3. Verifica idempotência: se já existe `plan_renewal_requests` para esse `(client_id, renewal_for_end_date)`, retorna a proposta existente
4. Cria `proposals` com `proposal_type = 'renewal'`, `implementation_value = 0`, `acceptance_link` com token único
5. Cria `plan_renewal_requests` vinculando ao `generated_proposal_id`
6. Retorna link público da proposta

## 3. Atualizar Edge Function `public-proposal`

Ao aceitar proposta com `proposal_type = 'renewal'`:
- Atualizar `plan_renewal_requests.status = 'concluido'`
- Atualizar cliente: `plan_start_date`, `plan_end_date` conforme `billing_plan`
- Registrar no histórico

## 4. Portal de Renovação (rota pública)

**Rota:** `/renovar/:token` (token = `portal_token` do cliente)

**Página:** `src/pages/RenovarPlano.tsx`
- Busca dados do cliente via edge function (usando portal_token)
- Mostra: plano atual, valor, vencimento
- Botão "Renovar Agora" → chama `generate-renewal-proposal`
- Após gerar: mostra link para a proposta pública + mensagem de sucesso

## 5. UI Interna

### 5.1 Botão "Gerar Renovação" no ClienteDetalhe
- No banner de alerta (quando plano vence em <=7d), adicionar botão "Gerar Renovação"
- Chama `generate-renewal-proposal` e abre proposta gerada

### 5.2 Configurações de Renovação
- Adicionar seção em `Configuracoes.tsx` (ou em "Minha Empresa") com os toggles de renovação

### 5.3 Widget "Renovações" no Dashboard
- Card com renovações pendentes/enviadas agrupadas por status
- Link para abrir proposta ou cliente

### 5.4 Filtro "Renovações" nas Propostas
- Na lista de propostas, filtro por `proposal_type = 'renewal'`

## 6. Envio automático WhatsApp/Email

Na edge function, após gerar a proposta:
- Se `renewal_whatsapp = true`: construir URL `wa.me/` e registrar `whatsapp_sent_at` (o link é retornado ao front que abre)
- Se `renewal_email = true`: placeholder para integração futura (registrar `email_sent_at`)

## 7. Arquivos

**Criar:**
- `supabase/functions/generate-renewal-proposal/index.ts`
- `src/pages/RenovarPlano.tsx`

**Editar:**
- `src/App.tsx` — rota `/renovar/:token`
- `src/components/clientes/ClienteDetalhe.tsx` — botão renovação no banner
- `src/pages/Dashboard.tsx` — widget renovações
- `src/pages/Configuracoes.tsx` ou `MinhaEmpresa.tsx` — seção renovação
- `supabase/functions/public-proposal/index.ts` — lógica de aceite com renovação
- `supabase/config.toml` — registrar nova edge function

## 8. Ordem de Execução

1. Migração DB (tabela + campos proposals + company_profile)
2. Edge function `generate-renewal-proposal`
3. Atualizar `public-proposal` para aceite de renovação
4. Página pública `/renovar/:token`
5. Botão renovação no ClienteDetalhe + configurações
6. Widget no Dashboard + filtro nas Propostas

