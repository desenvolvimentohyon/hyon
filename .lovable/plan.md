

# Plano: Módulo Parceiros Indicadores + Comissão Automática

## Fase 1 — Banco de Dados

### Nova tabela `partners`:
- `id` (uuid pk), `org_id` (uuid), `name` (text), `document` (text nullable), `phone` (text nullable), `email` (text nullable), `active` (bool default true), `commission_percent` (numeric default 0), `commission_type` (text default 'apenas_implantacao'), `notes` (text nullable), `created_at`, `updated_at`
- RLS: SELECT/INSERT/UPDATE/DELETE por `org_id` com roles admin/financeiro/comercial

### Alterações na tabela `proposals`:
- `partner_id` (uuid nullable FK partners.id)
- `partner_commission_percent` (numeric nullable)
- `partner_commission_value` (numeric nullable)
- `commission_generated` (bool default false)

### Alterações na tabela `financial_titles`:
- `partner_id` (uuid nullable)
- `reference_proposal_id` (uuid nullable)

### Indexes:
- `partners(org_id)`, `financial_titles(partner_id)`, `financial_titles(reference_proposal_id)`

---

## Fase 2 — Tela de Parceiros (`/parceiros`)

Nova página `src/pages/Parceiros.tsx`:
- Listagem com busca por nome, filtro ativo/inativo
- Colunas: Nome, Documento, Comissão %, Status, Total Comissões (sum de financial_titles com origin=comissao_parceiro), Total Pago
- Modal para criar/editar parceiro
- Botão desativar

Adicionar rota em `App.tsx` e link na sidebar (seção Gestão, ícone `Handshake`).

---

## Fase 3 — Vincular Parceiro à Proposta

### Tipo `Proposta` (types/propostas.ts):
- Adicionar campos: `partnerId`, `partnerCommissionPercent`, `partnerCommissionValue`, `commissionGenerated`

### PropostasContext.tsx:
- Mapear novos campos no `dbToProposta` e nos inserts/updates

### PropostaDetalhe.tsx:
- Adicionar card "Parceiro Indicador" com:
  - Dropdown de parceiros (busca da tabela `partners`)
  - Auto-preenchimento do percentual
  - Cálculo automático: `valorImplantacao × (percent / 100)`
  - Exibição visual: "Comissão do parceiro: R$ X,XX"

### Propostas.tsx (listagem):
- Sem alterações na tabela principal (manter simples)

---

## Fase 4 — Geração Automática de Comissão

Quando `acceptance_status` muda para `"aceitou"` no `updateProposta`:
- Verificar se existe `partner_id`, `valorImplantacao > 0`, e `commission_generated = false`
- Criar `financial_title` com:
  - `type = "pagar"`, `origin = "comissao_parceiro"`
  - `description = "Comissão referente à proposta {numero}"`
  - `value_original = partner_commission_value`
  - `due_at = data_aceite + 7 dias`
  - `partner_id`, `reference_proposal_id`
  - `status = "aberto"`
- Marcar `commission_generated = true` na proposta

Implementar diretamente no `PropostasContext.updateProposta` (sem edge function extra).

---

## Fase 5 — Contas a Pagar (filtros)

Em `ContasPagar.tsx`:
- Adicionar filtro por `origin = "comissao_parceiro"`
- Adicionar coluna "Parceiro" quando origin for comissão
- Permitir filtrar por parceiro

---

## Fase 6 — Dashboard Executivo

Em `DashboardExecutiveWidgets.tsx`, adicionar seção:
- Total comissões a pagar (aberto + parcial com origin=comissao_parceiro)
- Total comissões pagas
- Comissão gerada no mês
- Ranking top 5 parceiros por comissão

---

## Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/Parceiros.tsx` |
| Migração | Nova tabela `partners` + colunas em `proposals` e `financial_titles` |
| Editar | `src/types/propostas.ts` — novos campos |
| Editar | `src/contexts/PropostasContext.tsx` — mappers + auto-comissão |
| Editar | `src/pages/PropostaDetalhe.tsx` — card parceiro |
| Editar | `src/pages/financeiro/ContasPagar.tsx` — filtro comissão |
| Editar | `src/components/DashboardExecutiveWidgets.tsx` — widgets comissão |
| Editar | `src/App.tsx` — rota /parceiros |
| Editar | `src/components/layout/AppSidebar.tsx` — link Parceiros |

