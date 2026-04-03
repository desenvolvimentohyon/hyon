

## Plano: Filtrar títulos por mês atual + vencidos anteriores

### Problema
Atualmente, Contas a Receber e Contas a Pagar exibem **todos** os títulos do banco, independente do mês. O usuário quer ver apenas títulos do mês atual, com exceção de títulos vencidos/em atraso de meses anteriores.

### Solução
Adicionar um filtro de data no `useMemo` de cada página, mantendo apenas:
1. Títulos com vencimento no **mês atual** (qualquer status)
2. Títulos de **meses anteriores** que estejam com status `"vencido"` ou `"aberto"` com vencimento passado (em atraso)

### Alterações

#### `src/pages/financeiro/ContasReceber.tsx`
No `useMemo` `receber` (~linha 38-46), adicionar filtro temporal antes dos filtros existentes:

```typescript
const receber = useMemo(() => {
  const now = new Date();
  const mesAtualInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const mesAtualFim = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const hoje = new Date().toISOString().split("T")[0];

  let list = titulos.filter(t => {
    if (t.tipo !== "receber") return false;
    // Mês atual: mostrar tudo
    if (t.vencimento >= mesAtualInicio && t.vencimento <= mesAtualFim) return true;
    // Meses anteriores: apenas vencidos/em atraso
    if (t.vencimento < mesAtualInicio && (t.status === "vencido" || (t.status === "aberto" && t.vencimento < hoje))) return true;
    return false;
  });
  // ... filtros de status e cliente existentes
}, [...]);
```

#### `src/pages/financeiro/ContasPagar.tsx`
Mesma lógica no `useMemo` `pagar` (~linha 37-43):

```typescript
const pagar = useMemo(() => {
  const now = new Date();
  const mesAtualInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const mesAtualFim = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const hoje = new Date().toISOString().split("T")[0];

  let list = titulos.filter(t => {
    if (t.tipo !== "pagar") return false;
    if (t.vencimento >= mesAtualInicio && t.vencimento <= mesAtualFim) return true;
    if (t.vencimento < mesAtualInicio && (t.status === "vencido" || (t.status === "aberto" && t.vencimento < hoje))) return true;
    return false;
  });
  // ... filtros existentes
}, [...]);
```

### Impacto
2 arquivos editados, ~10 linhas alteradas em cada. Sem alterações de banco. Os KPIs de vencidos/hoje/7 dias continuam funcionando normalmente pois operam sobre a lista já filtrada.

