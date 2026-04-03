

## Plano: Unificar Cálculo do Ticket Médio e MRR

### Problema
O **Painel Executivo** calcula MRR e Ticket Médio filtrando por `statusCliente === "ativo"`, enquanto a **Visão Geral do Financeiro** filtra por `mensalidadeAtiva` (campo `recurrence_active` do banco). São critérios diferentes — um cliente pode estar "ativo" mas com mensalidade desativada, ou vice-versa.

### Solução
Padronizar ambas as páginas para usar o mesmo critério: **`statusCliente === "ativo" AND mensalidadeAtiva === true`**. Isso garante que só clientes ativos COM mensalidade recorrente ativa sejam contados no MRR e ticket médio.

### Alterações

#### 1. `src/pages/Executivo.tsx` (linha ~82-84)
- Alterar filtro de `ativos` para incluir `mensalidadeAtiva`:
  ```typescript
  const ativos = clientesReceita.filter(c => c.statusCliente === "ativo" && c.mensalidadeAtiva);
  ```

#### 2. `src/pages/financeiro/FinanceiroVisaoGeral.tsx` (linha ~67)
- Alterar filtro do MRR para incluir `statusCliente`:
  ```typescript
  const mrr = clientesReceita.filter(c => c.statusCliente === "ativo" && c.mensalidadeAtiva).reduce(...)
  ```

### Impacto
2 arquivos, ~2 linhas alteradas. Os valores de MRR e Ticket Médio passarão a ser idênticos em ambas as páginas.

