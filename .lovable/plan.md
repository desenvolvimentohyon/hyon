

## Plano: Adicionar botão de excluir lançamento no dialog de detalhes

### O que será feito
Adicionar um botão "Excluir" no dialog de detalhes do lançamento (Visão Geral), com confirmação via AlertDialog antes de deletar.

### Alterações

**`src/pages/financeiro/FinanceiroVisaoGeral.tsx`**

1. Importar `deleteTitulo` do contexto (já existe no `FinanceiroContext`) e componentes `AlertDialog*`
2. Adicionar state `confirmarExclusao` (boolean)
3. No `DialogFooter`, adicionar botão "Excluir" com variante `destructive` ao lado esquerdo, que abre o AlertDialog de confirmação
4. No AlertDialog, ao confirmar: chamar `deleteTitulo(id)`, fechar ambos os dialogs, exibir toast de sucesso
5. Importar `Trash2` icon do lucide-react

### Resultado visual

```text
┌──────────────────────────────────────┐
│ Detalhes do Lançamento               │
├──────────────────────────────────────┤
│ ... campos existentes ...            │
│                                      │
│ [🗑 Excluir]    [Cancelar] [Salvar]  │
└──────────────────────────────────────┘

         ┌─── Confirmação ───┐
         │ Deseja realmente   │
         │ excluir este       │
         │ lançamento?        │
         │                    │
         │ [Cancelar] [Excluir]│
         └────────────────────┘
```

### Detalhes técnicos
- `deleteTitulo` já existe no `FinanceiroContext` e faz `DELETE` na tabela `financial_titles`
- RLS permite delete para role `admin` com permissão `financeiro:excluir`

