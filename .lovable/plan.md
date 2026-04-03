

## Plano: Mostrar apenas clientes com plano mensal na geração de mensalidades

### Problema
A tela de Gerar Mensalidades exibe todos os clientes ativos com recorrência, independente do plano contratado. O usuário quer que apareçam apenas os clientes no plano mensal.

### Solução
No `useEffect` de `src/pages/financeiro/GerarMensalidades.tsx` (~linha 56-64), adicionar um filtro na query de clientes para trazer apenas aqueles cujo `plan_id` corresponde a um plano com `months_validity = 1` (Plano Mensal).

### Alteração em `src/pages/financeiro/GerarMensalidades.tsx`

1. Antes de buscar clientes, consultar a tabela `plans` para obter os IDs dos planos com `months_validity = 1`
2. Filtrar a query de `clients` usando `.in("plan_id", monthlyPlanIds)`

```typescript
// Dentro do useEffect, antes da query de clients:
const plansRes = await supabase
  .from("plans")
  .select("id")
  .eq("months_validity", 1);

const monthlyPlanIds = (plansRes.data || []).map(p => p.id);

// Na query de clients, adicionar:
.in("plan_id", monthlyPlanIds.length ? monthlyPlanIds : ["00000000-0000-0000-0000-000000000000"])
```

### Impacto
1 arquivo editado, ~5 linhas adicionadas. Sem alterações de banco. Clientes em planos anuais, semestrais ou trimestrais não aparecerão mais na tela de geração de mensalidades.

