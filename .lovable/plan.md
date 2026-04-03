

## Plano: Editar, Excluir e Melhorar Parcelas em Contas a Pagar

### Contexto
O `FinanceiroContext` já expõe `updateTitulo` e `deleteTitulo`. A página `ContasPagar.tsx` não os utiliza. O formulário de nova despesa já tem campo de parcelas, mas não mostra o valor calculado por parcela.

### Alterações em `src/pages/financeiro/ContasPagar.tsx`

**1. Importar `updateTitulo` e `deleteTitulo` do contexto**

**2. Adicionar menu de ações (editar/excluir) na coluna "Ações" da tabela**
- Usar o componente `RowActions` já existente com opções "Editar" e "Excluir"
- Editar abre um modal de edição pré-preenchido
- Excluir pede confirmação via `AlertDialog` antes de chamar `deleteTitulo`

**3. Modal de Edição**
- Novo estado `modalEditar` com o título selecionado
- Campos editáveis: descrição, valor, vencimento, fornecedor, categoria, status
- Ao salvar, chama `updateTitulo(id, changes)`

**4. Melhorar exibição de parcelas no formulário de nova despesa**
- Mostrar texto calculado: "Valor por parcela: R$ X,XX" abaixo do campo de parcelas
- Atualiza dinamicamente conforme o usuário altera valor total ou número de parcelas

**5. Confirmação de exclusão**
- `AlertDialog` com mensagem "Deseja realmente excluir esta despesa?"
- Ao confirmar, chama `deleteTitulo(id)` e exibe toast de sucesso

### Impacto
1 arquivo editado (`ContasPagar.tsx`), ~80 linhas adicionadas. Sem alterações de banco — as funções já existem no contexto.

