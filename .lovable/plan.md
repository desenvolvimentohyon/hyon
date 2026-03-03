

# Plano: Corrigir badge de comissão recorrente em ContasPagar

## Problema
A comissão recorrente R$ 17,50 está aparecendo com badge "Implantação" em vez de "Recorrente". O código em `ContasPagar.tsx` provavelmente não está lendo o campo `commission_type` do título financeiro para diferenciar.

## Investigação Necessária
Verificar como a coluna Origem em `ContasPagar.tsx` renderiza as badges — provavelmente está usando apenas `origin === "comissao_parceiro"` sem checar `commission_type`.

## Correção
No `ContasPagar.tsx`, na renderização da coluna Origem, quando `origin === "comissao_parceiro"`:
- Se `commission_type === "recorrente"` → badge "Recorrente" (cor diferente, ex: azul)
- Se `commission_type === "implantacao"` ou sem valor → badge "Implantação"

Também precisa garantir que o tipo `TituloFinanceiro` no frontend tenha o campo `commissionType` mapeado do DB `commission_type`.

## Arquivos
- `src/pages/financeiro/ContasPagar.tsx` — ajustar renderização da badge
- `src/contexts/FinanceiroContext.tsx` — verificar se `commission_type` é mapeado no `dbToTitulo`
- `src/types/financeiro.ts` — verificar se `commissionType` existe no tipo

