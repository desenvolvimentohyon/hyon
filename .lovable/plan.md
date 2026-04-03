

## Plano: Reduzir Tamanho do Card/Modal "Lançar Despesa"

### Problema
O modal de "Lançar Despesa" ocupa muito espaço vertical com campos espalhados e espaçamento largo.

### Alterações em `src/pages/financeiro/ContasPagar.tsx`

**1. Compactar o formulário `NovaDespesaForm`**
- Reduzir `space-y-3` para `space-y-2`
- Agrupar campos em pares lado a lado usando grid de 2 colunas:
  - Linha 1: Descrição (full width)
  - Linha 2: Valor + Parcelas/Meses
  - Linha 3: Vencimento + Fornecedor
  - Linha 4: Categoria (full width)
  - Checkbox de recorrência inline
- Reduzir padding do card de resumo de parcelas de `p-4` para `p-3`
- Usar `text-base` ao invés de `text-lg` no resumo de parcelas

**2. Reduzir tamanho do DialogContent**
- Adicionar `className="sm:max-w-md"` ao `DialogContent` do modal "Lançar Despesa" (padrão é `sm:max-w-lg`)

### Impacto
1 arquivo, ~15 linhas alteradas. Layout mais compacto sem perder funcionalidade.

