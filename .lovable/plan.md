

## Plano: Exibir custo de cada cliente na listagem

O campo `custoMensal` já está carregado no contexto (`monthly_cost_value`), mas não é exibido na listagem — só aparece a mensalidade e a margem.

### Alteração

**`src/pages/Clientes.tsx`** (linhas 287-293)
- Adicionar uma linha mostrando o custo mensal entre a mensalidade e a margem
- Layout: três informações visíveis no `extraInfo` do card:
  - **Mensalidade**: R$ X (já existe)
  - **Custo**: R$ X (novo)
  - **Margem**: R$ X (já existe, com cor condicional)

O resultado será algo como:
```
R$ 500,00  •  Custo: R$ 200,00  •  Margem: R$ 300,00
```

### Arquivo afetado
1. `src/pages/Clientes.tsx` — bloco `extraInfo` do `ClienteCard`

