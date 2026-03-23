

## Plano: Remover campos de preço do formulário de Sistema

### Resumo
O formulário de criação/edição de Sistema passará a ter apenas Nome, Descrição e Status (ativo/inativo). Os campos Valor Custo e Valor Venda serão removidos, já que os preços são definidos pelos módulos vinculados. A tabela de listagem também será atualizada para remover as colunas de custo/venda (ou exibir a soma dos módulos vinculados).

### Editar: `src/pages/Parametros.tsx`

1. **Formulário do Sistema (modal, linhas 194-208)** — Remover os dois campos `CurrencyInput` (Valor Custo e Valor Venda)
2. **Estado do formulário (linha 34)** — Remover `valorCusto` e `valorVenda` do estado `fSistema`
3. **Tabela de sistemas (linhas 78-93)** — Remover colunas "Custo" e "Venda", ajustar colspan do empty state

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Parametros.tsx` | Remover campos de preço do form e tabela de sistemas |

