

## Plano: Calcular custo de módulos automaticamente a partir dos módulos vinculados

### Resumo
Substituir o campo manual "Custo módulos" por um valor calculado automaticamente com base nos módulos vinculados ao cliente (tabela `client_modules` → `system_modules.cost_value`). O campo passará a ser somente leitura, exibindo a soma dos custos dos módulos contratados.

### Editar: `src/components/clientes/tabs/TabCusto.tsx`

1. **Buscar módulos vinculados** — Adicionar `useEffect` que carrega os módulos do cliente via `client_modules` → `system_modules` (mesma lógica do TabModulos), somando `cost_value` de cada módulo.

2. **Substituir campo manual** — Trocar o `CurrencyInput` de "Custo módulos" por um campo read-only que exibe a soma calculada dos módulos vinculados, com indicação de quantos módulos estão incluídos.

3. **Atualizar cálculo do total** — O `totalCusto` passará a usar o valor calculado dos módulos em vez do `meta.custoModulos` manual.

4. **Manter campos editáveis** — Os campos "Custo repasse/franquia", "Custo cloud/infra" e "Outros custos" continuam editáveis normalmente.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/components/clientes/tabs/TabCusto.tsx` | Fetch de módulos vinculados + campo read-only calculado |

