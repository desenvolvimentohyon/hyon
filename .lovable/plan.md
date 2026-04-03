

## Diagnóstico: Cortesias não aparecem no card KPI

### Problema
O campo `is_courtesy` é salvo corretamente no banco de dados (confirmei que existe um registro com `is_courtesy = true`), porém quando os títulos são carregados no `FinanceiroContext`, o mapeamento de DB → objeto `TituloFinanceiro` **não inclui** o campo `isCourtesy`. Portanto, o filtro `(t as any).isCourtesy` no `FinanceiroVisaoGeral.tsx` sempre retorna `undefined`/`false`.

### Correção

#### 1. `src/contexts/FinanceiroContext.tsx`
- No mapeamento de cada registro do banco (linha ~43), adicionar:
  - `isCourtesy: r.is_courtesy || false`
  - `courtesyReason: r.courtesy_reason || null`

#### 2. `src/types/financeiro.ts`
- Adicionar os campos `isCourtesy: boolean` e `courtesyReason: string | null` na interface `TituloFinanceiro`

#### 3. `src/pages/financeiro/FinanceiroVisaoGeral.tsx`
- Remover o cast `(t as any)` no filtro de cortesias (linha 77), já que o campo passará a existir no tipo

### Impacto
~3 arquivos, ~5 linhas alteradas. Correção pontual de mapeamento de dados.

