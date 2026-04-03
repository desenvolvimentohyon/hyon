

## Plano: Adicionar Checkbox de Recorrência em Contas a Pagar

### O que será feito
Adicionar um checkbox "Recorrente" no formulário "Lançar Despesa" que, quando marcado, gera automaticamente lançamentos mensais repetidos por um número de meses definido pelo usuário.

### Alterações em `src/pages/financeiro/ContasPagar.tsx`

**1. Novo estado no `NovaDespesaForm`**
- `recorrente: boolean` (default false)
- `mesesRecorrencia: string` (default "12") — quantos meses gerar

**2. Checkbox + campo de meses**
- Abaixo do campo "Parcelas", adicionar um `Checkbox` com label "Despesa recorrente (mensal)"
- Quando marcado, exibir campo "Quantidade de meses" e ocultar o campo de parcelas (recorrência e parcelamento são mutuamente exclusivos)
- Exibir resumo: "12x de R$ 500,00 — de 03/04/2026 até 03/03/2027"

**3. Lógica de salvamento**
- Se recorrente, gerar N títulos (um por mês) com o **valor cheio** (não dividido), cada um com vencimento e competência incrementados mensalmente
- Descrição: "Aluguel (recorrente 1/12)", "Aluguel (recorrente 2/12)", etc.

**4. Badge na tabela**
- Identificar padrão `(recorrente X/Y)` na descrição e exibir badge "Recorrente" em vez de "Parcelado"

### Diferença entre Parcelas e Recorrência
- **Parcelas**: valor total dividido entre N meses
- **Recorrência**: mesmo valor repetido por N meses

### Impacto
1 arquivo editado, ~25 linhas adicionadas. Importar `Checkbox` de `@/components/ui/checkbox`.

