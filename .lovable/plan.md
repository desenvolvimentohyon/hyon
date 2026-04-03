

## Plano: Corrigir KPI "Contas a Pagar" na Visão Geral

### Problema
O card "Contas a Pagar" na Visão Geral soma **todos** os títulos a pagar com status aberto/parcial, incluindo parcelas futuras (2027, 2028). Resultado: R$ 15.483,43 (59 títulos), quando deveria mostrar apenas o que é relevante para o mês atual.

### Causa (linha 65 de `FinanceiroVisaoGeral.tsx`)
```typescript
const pagar = titulos.filter(t => t.tipo === "pagar" && (t.status === "aberto" || t.status === "parcial"));
```
Nenhum filtro de data — soma tudo.

### Correção em `src/pages/financeiro/FinanceiroVisaoGeral.tsx`

Aplicar o mesmo critério de visibilidade usado em `ContasPagar.tsx`: mostrar apenas títulos do mês atual + títulos vencidos de meses anteriores.

```typescript
const now = new Date();
const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
const mesFim = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
const hj = now.toISOString().split("T")[0];

const pagar = titulos.filter(t => {
  if (t.tipo !== "pagar" || (t.status !== "aberto" && t.status !== "parcial")) return false;
  // Mês atual
  if (t.vencimento >= mesInicio && t.vencimento <= mesFim) return true;
  // Vencidos de meses anteriores
  if (t.vencimento < mesInicio && t.vencimento < hj) return true;
  return false;
});
```

Mesma lógica para o filtro de `receber` (linha 64), para manter consistência.

### Impacto
1 arquivo editado, ~10 linhas alteradas. O card passará a exibir R$ 500,00 (apenas a parcela de abril/2026).

