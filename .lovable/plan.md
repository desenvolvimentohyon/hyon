

## Plano: Alteração em lote de clientes na tela inicial

### Objetivo
Permitir selecionar múltiplos clientes na tabela e aplicar alterações em lote para: **data de vencimento**, **índice de reajuste**, **regime da empresa** e **plano de cobrança**.

### Como funciona

1. Um botão "Alterar em Lote" aparece no cabeçalho da página, ao lado de "Novo Cliente"
2. Ao clicar, a tabela entra em **modo de seleção**: aparece uma coluna de checkboxes + checkbox "selecionar todos"
3. Ao selecionar clientes, um painel aparece com os 4 campos editáveis (todos opcionais — só altera o que for preenchido):
   - **Dia de vencimento** (select 1-31) → campo `default_due_day`
   - **Índice de reajuste** (select: IGPM, IPCA, Personalizado + campo %) → campos `adjustment_type` e `adjustment_percent`
   - **Regime da empresa** (select: Simples Nacional, Lucro Presumido, Lucro Real, MEI) → campo `tax_regime`
   - **Plano de cobrança** (select: Mensal, Trimestral, Semestral, Anual) → campo `billing_plan` no metadata
4. Botão "Aplicar alterações" faz update em lote via Supabase para todos os clientes selecionados
5. Após sucesso, recarrega a lista e exibe toast de confirmação

### Alterações — 1 arquivo

**`src/pages/Clientes.tsx`**
- Adicionar estado `batchMode`, `selectedIds: Set<string>`, `batchFields`
- Botão "Alterar em Lote" no `PageHeader.actions`
- Coluna de checkbox na tabela (condicional ao `batchMode`)
- Dialog ou painel inferior com os 4 campos de edição em lote
- Função `handleBatchUpdate` que faz `supabase.from("clients").update(...)` para cada campo preenchido, filtrando por `id.in(selectedIds)`
- Para `billing_plan` (metadata), merge com metadata existente via loop individual

### Detalhes técnicos
- Campos DB diretos: `default_due_day`, `adjustment_type`, `adjustment_percent`, `tax_regime`
- Campo em metadata JSONB: `billing_plan` — requer leitura do metadata atual de cada cliente antes de fazer merge
- Após aplicar, chama o método de refresh do contexto para atualizar a lista
- Usa `Checkbox` do shadcn/ui para seleção

