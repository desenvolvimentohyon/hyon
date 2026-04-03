

## Plano: Mensalidade Parcial na Geração em Lote

### Objetivo
Adicionar na tela "Gerar Mensalidades" a opção de gerar uma mensalidade com valor parcial (diferente do valor integral do cliente), mantendo a integração com o fluxo financeiro existente (títulos, receitas, etc.).

### Como funciona hoje
- A tela lista clientes ativos com recorrência e gera títulos via `addTitulo` do `FinanceiroContext`
- Já existe a opção de **cortesia** (valor R$ 0,00 com justificativa)
- O `addTitulo` calcula `value_final` automaticamente e insere em `financial_titles`
- Receitas, despesas, lucro e demais métricas derivam dos dados de `financial_titles` — não precisam de atualização separada

### Alterações

#### `src/pages/financeiro/GerarMensalidades.tsx`
1. **Novo estado `partialMap`** — `Record<string, { enabled: boolean; value: number }>` para controlar quais clientes terão mensalidade parcial e qual o valor
2. **Nova coluna "Parcial"** na tabela — um `Switch` para ativar modo parcial (mutuamente exclusivo com cortesia)
3. **Campo de valor** — Quando parcial ativado, exibe um `CurrencyInput` na linha expandida (similar ao motivo da cortesia) para informar o valor a cobrar
4. **Validação** — Valor parcial deve ser > 0 e < valor integral da mensalidade
5. **Atualizar `handleGenerate`** — Quando parcial, usa o valor informado como `valorOriginal` e adiciona observação "Mensalidade parcial (valor integral: R$ X)"
6. **Atualizar `totalSelected`** — Contabilizar o valor parcial na soma quando aplicável
7. **Badge de status** — Mostrar badge "Parcial" em amarelo quando o modo parcial está ativo

### Fluxo financeiro
O `addTitulo` já insere corretamente em `financial_titles` com `value_original` e `value_final`. Todas as métricas (receita, MRR, lucro) já derivam dessa tabela. Portanto, ao gerar com valor parcial, os demais campos financeiros são automaticamente alimentados — não há necessidade de alterações em outros contextos ou páginas.

### Impacto
1 arquivo editado (~40 linhas adicionadas). Sem alterações de banco de dados.

