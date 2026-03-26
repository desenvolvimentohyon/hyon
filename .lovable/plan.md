

## Plano: Ocultar clientes cancelados da listagem

### Problema
Clientes com status `cancelado` continuam aparecendo na listagem principal, mesmo após exclusão (soft-delete).

### Alteração

**`src/pages/ClientesReceita.tsx`**

1. No `useMemo` do `filtered` (linha ~153), adicionar filtro para excluir clientes com `statusCliente === "cancelado"` **quando o filtro de status for "todos"**
2. Assim, cancelados só aparecem se o usuário selecionar explicitamente o filtro "Cancelado"

### Detalhe técnico

Na lógica de filtragem (linha 153-160), adicionar:
```typescript
if (filtroStatus === "todos" && c.statusCliente === "cancelado") return false;
```

Isso mantém a possibilidade de visualizar cancelados via filtro, mas os oculta por padrão.

