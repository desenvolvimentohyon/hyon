

## Plano: Corrigir listagem de clientes em Gerar Mensalidades

### Problema
A query atual filtra clientes com `.in("plan_id", monthlyPlanIds)`, mas **nenhum cliente tem `plan_id` preenchido** (0 de 38 clientes). Resultado: lista sempre vazia.

### Solução
Remover o filtro por `plan_id` na query de clientes. A tela já filtra corretamente por `status = ativo`, `recurrence_active = true` e `monthly_value_final > 0` -- esses critérios são suficientes para identificar clientes com mensalidade ativa.

### Alteração em `src/pages/financeiro/GerarMensalidades.tsx`

1. Remover a query de `plans` (linhas 58-64) -- não é mais necessária
2. Remover o `.in("plan_id", ...)` da query de clientes (linha 74)
3. Manter todos os demais filtros intactos

### Impacto
1 arquivo, ~5 linhas removidas. Sem alteração de banco.

