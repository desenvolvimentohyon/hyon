

# Plano: Comissão Avançada — Implantação + Recorrente (Mensalidade)

## Fase 1 — Migração de Banco de Dados

### 1.1 Alterar `partners`
Adicionar colunas (mantendo `commission_percent` e `commission_type` existentes):
- `commission_implant_percent` numeric default 0
- `commission_recur_percent` numeric default 0
- `commission_recur_months` int default 0 (0 = ilimitado)
- `commission_recur_apply_on` text default 'on_invoice_paid' (valores: on_invoice_created, on_invoice_paid)

### 1.2 Alterar `proposals`
Renomear/adicionar (a tabela já tem `partner_id`, `partner_commission_percent`, `partner_commission_value`, `commission_generated`):
- `partner_commission_implant_percent` numeric nullable
- `partner_commission_implant_value` numeric nullable
- `partner_commission_recur_percent` numeric nullable
- `partner_commission_recur_months` int nullable
- `partner_commission_recur_apply_on` text nullable
- Renomear `commission_generated` → `commission_implant_generated` (ou adicionar separado mantendo compatibilidade)

### 1.3 Alterar `clients`
- `ref_partner_id` uuid nullable
- `ref_partner_start_at` date nullable
- `ref_partner_end_at` date nullable
- `ref_partner_recur_percent` numeric nullable
- `ref_partner_recur_months` int nullable
- `ref_partner_recur_apply_on` text nullable

### 1.4 Alterar `financial_titles`
- `reference_title_id` uuid nullable (referência à mensalidade que originou comissão recorrente)
- `commission_type` text nullable (implantacao | recorrente)
- Índice único para idempotência: `(org_id, commission_type, partner_id, reference_title_id, competency)` — parcial, onde `commission_type IS NOT NULL`

---

## Fase 2 — UI Parceiros (`/parceiros`)

Atualizar `Parceiros.tsx`:
- Formulário: trocar campo único `commission_percent` por campos separados:
  - % Comissão Implantação
  - % Comissão Mensalidade
  - Duração (meses) — 0 = ilimitado
  - Aplicar em: dropdown (Ao gerar mensalidade / Ao pagar mensalidade)
- Condicional: campos de recorrência só aparecem se `commission_type = implantacao_e_mensalidade`
- Listagem: mostrar "Impl: X% / Recor: Y%" na coluna Comissão

---

## Fase 3 — Proposta (vincular parceiro avançado)

### types/propostas.ts
Adicionar ao `Proposta`:
- `partnerCommissionImplantPercent`, `partnerCommissionImplantValue`
- `partnerCommissionRecurPercent`, `partnerCommissionRecurMonths`, `partnerCommissionRecurApplyOn`
- Renomear/manter `commissionGenerated` como `commissionImplantGenerated`

### PropostasContext.tsx
- Atualizar `dbToProposta` e mappers de insert/update com novos campos
- No `updateProposta` quando `statusAceite = "aceitou"`:
  - Gerar comissão implantação (como já faz, com `commission_type = "implantacao"`)
  - Gravar vínculo no cliente: `ref_partner_*` (se cliente não tiver parceiro)

### PropostaDetalhe.tsx
- Ao selecionar parceiro: preencher automaticamente % implantação e % recorrente
- Ao preencher valor implantação: calcular `partnerCommissionImplantValue`
- Ao preencher mensalidade: exibir "Comissão recorrente estimada: R$ X/mês por Y meses"
- Manter layout existente, apenas expandir o card "Parceiro Indicador"

---

## Fase 4 — Automação de Comissão Recorrente

Implementar no `FinanceiroContext.tsx` (na função `baixarTitulo` para `on_invoice_paid`) e no `billing-cron` (para `on_invoice_created`):

### Lógica `on_invoice_paid` (no `baixarTitulo`)
Quando marcar mensalidade como paga:
1. Verificar se `client.ref_partner_id` existe
2. Verificar se `ref_partner_recur_apply_on = "on_invoice_paid"`
3. Verificar período (meses desde `ref_partner_start_at` vs `ref_partner_recur_months`)
4. Verificar idempotência (não existe título com mesma `reference_title_id + competency + commission_type`)
5. Criar `financial_title` tipo pagar, origin `comissao_parceiro`, `commission_type = "recorrente"`

### Lógica `on_invoice_created` (no `billing-cron`)
Quando billing-cron cria mensalidade:
1. Mesmas verificações acima mas com `ref_partner_recur_apply_on = "on_invoice_created"`
2. Criar comissão recorrente automaticamente

---

## Fase 5 — Contas a Pagar (badges Implantação/Recorrente)

Em `ContasPagar.tsx`:
- Na coluna Origem: exibir badge "Implantação" ou "Recorrente" quando `origin = comissao_parceiro` baseado no `commission_type` do título
- Sem mudanças estruturais (filtros de origem já existem)

---

## Fase 6 — Dashboard (widget comissão recorrente prevista)

Em `DashboardExecutiveWidgets.tsx`:
- Adicionar ao bloco de comissões: "Recorrente Prevista" — soma de comissões recorrentes esperadas no mês baseado em clientes ativos com `ref_partner_id`

---

## Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Migração SQL | Nova migration: colunas em partners, proposals, clients, financial_titles + índice único |
| Editar | `src/pages/Parceiros.tsx` — formulário avançado |
| Editar | `src/types/propostas.ts` — novos campos |
| Editar | `src/contexts/PropostasContext.tsx` — mappers + auto-comissão implantação + vínculo cliente |
| Editar | `src/pages/PropostaDetalhe.tsx` — campos recorrência no card parceiro |
| Editar | `src/contexts/FinanceiroContext.tsx` — comissão recorrente on_invoice_paid |
| Editar | `supabase/functions/billing-cron/index.ts` — comissão recorrente on_invoice_created |
| Editar | `src/pages/financeiro/ContasPagar.tsx` — badges implantação/recorrente |
| Editar | `src/components/DashboardExecutiveWidgets.tsx` — widget recorrente prevista |

