

## Plano: Simplificar aba Custos Operacionais

### Mudanças em `src/components/clientes/tabs/TabCusto.tsx`

1. **Remover campo "Custo repasse/franquia"** (linha 76) — não será mais usado no cálculo
2. **Remover campo "Custo cloud/infra"** (linha 86) — eliminar campo e variável `custoCloud`
3. **Adicionar campo de observação** ao lado de "Outros custos" — um `Textarea` para o usuário descrever o que compõe os outros custos (salvo em `meta.outrosCustosObs`)
4. **Ajustar cálculo do total**: `totalCusto = custoModulos + outrosCustos` (sem `costValue` e sem `custoCloud`)

| Arquivo | Mudança |
|---------|------|
| `src/components/clientes/tabs/TabCusto.tsx` | Remover repasse/franquia e cloud/infra, adicionar observação em outros custos, ajustar cálculo |

