

## Plano: Adicionar exclusão de cliente com justificativa

### O que será feito
Adicionar a opção de excluir um cliente na listagem, exigindo uma justificativa obrigatória antes da exclusão. A exclusão será feita via soft-delete (marcar como "excluido") ou hard-delete, conforme a política atual do sistema.

### Abordagem
Como o sistema já usa a tabela `clients` com RLS que permite delete apenas para `admin`, usaremos **hard delete** com registro de justificativa no campo `cancellation_reason` antes de excluir (ou alternativamente, status "excluido"). Vou usar **soft-delete** (status = "excluido" + motivo em `cancellation_reason`) para manter rastreabilidade.

### Alterações

1. **`src/contexts/AppContext.tsx`**
   - Adicionar função `deleteCliente(id: string, justificativa: string)` que atualiza o cliente com `status: 'excluido'` e `cancellation_reason: justificativa`, depois remove da lista local
   - Exportar no contexto

2. **`src/pages/Clientes.tsx`**
   - Adicionar estado para controlar o dialog de exclusão (`deleteTarget`, `deleteJustificativa`)
   - Adicionar ação "Excluir" (ícone Trash2, variant destructive) no `RowActions` de cada cliente
   - Criar um `AlertDialog` com campo `Textarea` para justificativa obrigatória
   - Ao confirmar, chamar `deleteCliente` e exibir toast de sucesso
   - Filtrar clientes com status "excluido" da listagem

### Detalhes técnicos
- Nenhuma migração necessária — os campos `status` e `cancellation_reason` já existem na tabela `clients`
- RLS de delete já restringe a `admin`; usaremos update (permitido para admin/comercial/suporte/implantacao) para o soft-delete
- O filtro na listagem ocultará automaticamente clientes excluídos

