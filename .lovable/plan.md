

## Plano: Adicionar opção de excluir cliente na listagem

### Problema
A página de listagem de clientes (`/clientes` → `ClientesReceita.tsx`) não possui opção de excluir. Existe apenas o botão "Abrir". A funcionalidade de exclusão (soft-delete com justificativa) já existe no `AppContext` mas não está conectada a esta página.

### Alterações

**`src/pages/ClientesReceita.tsx`**

1. Importar componentes necessários: `RowActions`, `AlertDialog`, `Trash2`, `Eye`, ícones, e `deleteCliente` do `ReceitaContext` (ou `AppContext`)
2. Substituir o botão "Abrir" por `RowActions` com três opções:
   - "Ver detalhes" → abre o detalhe
   - "Alterar status" → altera status (já existe o `handleStatusChange`)
   - "Excluir" → abre diálogo de confirmação (variante destructive)
3. Adicionar estados `deleteTarget` e `deleteJustificativa`
4. Adicionar `AlertDialog` de confirmação com campo de justificativa obrigatória (mesmo padrão do `Clientes.tsx`)
5. Ao confirmar, executar soft-delete: atualizar `status` → `"excluido"`, `cancellation_reason` → justificativa, `cancelled_at` → data atual
6. Recarregar a lista após exclusão

### Detalhes técnicos
- O soft-delete já funciona via `supabase.from("clients").update({ status: "excluido", cancellation_reason, cancelled_at })` — mesmo padrão do `AppContext.deleteCliente`
- O `ReceitaContext` já tem `deleteClienteReceita` mas faz hard-delete (`supabase.from("clients").delete()`). Vou alterar para soft-delete consistente
- O `TableRow` precisa da classe `group` para que o `RowActions` (opacity on hover) funcione

