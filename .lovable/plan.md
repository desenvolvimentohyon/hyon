

## Auditoria Técnica Completa — Plano de Correções

### Resumo dos Problemas Encontrados

Após análise profunda do frontend, backend, Edge Functions e segurança, identifiquei **4 categorias** de problemas a corrigir:

---

### 1. Bug de Console — `MrrLabel` sem `forwardRef`

O componente `MrrLabel` em `DashboardExecutiveWidgets.tsx` é usado dentro de `TooltipTrigger` com `asChild`, que tenta passar uma ref. Como é um function component simples, gera o warning no console.

**Correção:** Converter `MrrLabel` para usar `React.forwardRef`.

---

### 2. Referências Obsoletas ao Seed e Dados Falsos

Apesar da remoção do `seed-org`, ainda restam no sistema:

- **6 funções "reset"** que exibem toast "Use a função de seed da organização" (seed já não existe)
- **Botão "Resetar Seed"** em `ConfiguracoesFinanceiras.tsx` (linha 296)
- **Botão "Resetar Dados Receita"** em `Configuracoes.tsx` (linha 263)
- **Botão "Resetar Dados"** em `Configuracoes.tsx` (linha 275)
- **`importarExtrato()`** no `FinanceiroContext.tsx` gera **10 movimentos bancários falsos** com dados aleatórios no banco de produção (linhas 353-371)
- **Evolução no Dashboard** (linhas 516-526) usa dados **simulados** ("6m atrás" com fator multiplicador) em vez de dados reais
- **"Clientes em Atraso" com dias de atraso falsos** (linhas 463-468) — calcula `diasAtraso` a partir de um hash do ID do cliente, gerando números fictícios

**Correções:**
- Remover todos os botões de "Resetar Seed/Dados" das telas de configuração
- Atualizar mensagens de toast das funções reset para serem coerentes (sem referência a seed)
- Substituir `importarExtrato()` por um placeholder que informa "Funcionalidade de importação de extrato em desenvolvimento"
- Substituir dados de evolução simulados por dados reais (query histórica de `financial_titles` agrupada por mês)
- Substituir cálculo falso de dias de atraso por dados reais da tabela `financial_titles` (títulos vencidos)

---

### 3. Edge Functions com Colunas Inexistentes

As Edge Functions `send-plan-renewal-alerts`, `generate-renewal-proposal` e `public-proposal` fazem queries diretas a colunas `billing_plan` e `plan_end_date` na tabela `clients`. Essas colunas **não existem** — os dados estão em `metadata` (JSONB). Isso causa falhas silenciosas (400 errors).

**Correções:**
- `send-plan-renewal-alerts/index.ts`: Alterar query para buscar `metadata` e filtrar `billing_plan` e `plan_end_date` em memória
- `generate-renewal-proposal/index.ts`: Mesma correção
- `public-proposal/index.ts`: Mesma correção
- Adicionar autenticação via header secret no `send-plan-renewal-alerts` (vulnerabilidade de segurança identificada)

---

### 4. Segurança — Vulnerabilidades Críticas

**4a. Proposals acessíveis anonimamente** (CRÍTICO)
A política RLS `public_select_by_token` permite que qualquer usuário anônimo leia TODAS as propostas que tenham `acceptance_link IS NOT NULL`. Correção: remover essa política RLS (o acesso público já é feito via Edge Function `public-proposal` com service role).

**4b. Edge Function sem autenticação** 
`send-plan-renewal-alerts` aceita chamadas sem autenticação. Qualquer pessoa pode disparar alertas de renovação para todos os clientes. Correção: adicionar verificação de secret header.

**4c. SELECT sem restrição de role em 14 tabelas**
Todas as tabelas sensíveis (clients, financial_titles, bank_accounts, etc.) permitem SELECT para qualquer usuário autenticado da org, independente do role. Correção: adicionar `has_permission()` nas políticas SELECT das tabelas mais críticas:
- `financial_titles`, `bank_accounts`, `bank_transactions`, `company_bank_accounts`: requerer `financeiro:visualizar`
- `asaas_settings`, `asaas_webhook_events`: requerer `financeiro:visualizar`
- `proposals`, `proposal_items`: requerer `propostas:visualizar`
- `partners`: requerer `parceiros:visualizar` (ou `comercial:visualizar`)

**Nota sobre clientes:** A tabela `clients` precisa ser acessível a múltiplos roles (suporte, comercial, implantação, financeiro), então o SELECT permanecerá com `org_id = current_org_id()` sem restrição adicional, pois quase todo perfil precisa ver clientes.

---

### Sequência de Implementação

1. **Migração SQL** — Remover política RLS `public_select_by_token` das proposals; Atualizar políticas SELECT das tabelas financeiras com `has_permission()`
2. **Edge Functions** — Corrigir queries de `billing_plan`/`plan_end_date` nas 3 funções; Adicionar auth no `send-plan-renewal-alerts`
3. **Frontend** — Fix `MrrLabel` forwardRef; Remover botões de reset/seed; Corrigir dados simulados no Dashboard; Corrigir `importarExtrato`

### Arquivos Modificados

- `src/components/DashboardExecutiveWidgets.tsx` — forwardRef fix
- `src/pages/Dashboard.tsx` — remover dados simulados de evolução e dias de atraso falsos
- `src/pages/Configuracoes.tsx` — remover botões de reset
- `src/pages/financeiro/ConfiguracoesFinanceiras.tsx` — remover botão Resetar Seed
- `src/pages/financeiro/ConciliacaoBancaria.tsx` — remover importação de extrato falso
- `src/contexts/FinanceiroContext.tsx` — corrigir importarExtrato
- `src/contexts/AppContext.tsx`, `ReceitaContext.tsx`, `PropostasContext.tsx`, `UsersContext.tsx`, `ParametrosContext.tsx` — atualizar mensagens de reset
- `supabase/functions/send-plan-renewal-alerts/index.ts` — fix queries + auth
- `supabase/functions/generate-renewal-proposal/index.ts` — fix queries
- `supabase/functions/public-proposal/index.ts` — fix queries
- Migração SQL para políticas RLS

