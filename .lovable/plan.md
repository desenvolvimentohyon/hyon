

## Plano: Adicionar edição de mensalidade em Contas a Receber

### Resumo
Adicionar um botão de edição (ícone `Edit`) na coluna de ações de cada título na tabela de Contas a Receber. Ao clicar, abre um dialog pré-preenchido com os dados do título, permitindo editar descrição, valor, vencimento, competência e observações. Ao salvar, chama `updateTitulo`.

### Alterações em `src/pages/financeiro/ContasReceber.tsx`

1. **Novo estado**: `editingTitulo: TituloFinanceiro | null`
2. **Botão Edit na tabela**: Adicionar ícone `Edit` nas ações de cada linha (para todos os status exceto `cancelado`)
3. **Dialog de edição**: Reutilizar estrutura similar ao modal de criação, com campos:
   - Descrição
   - Valor original (CurrencyInput)
   - Vencimento (date)
   - Competência (month)
   - Observações (textarea)
   - Cliente (select, desabilitado para mensalidades geradas)
4. **Salvar**: Chamar `updateTitulo(id, { descricao, valorOriginal, vencimento, competenciaMes, observacoes })` e fechar o dialog

### Impacto
1 arquivo editado, ~50 linhas adicionadas. Sem alteração de banco.

