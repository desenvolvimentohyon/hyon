

## Plano: Remover seletor de usuário do Topbar

O nome do usuário já está no footer da sidebar, então o seletor duplicado no canto superior direito deve ser removido.

### Mudança

**Arquivo**: `src/components/layout/Topbar.tsx`

- Remover o `<Separator>` (linha 347) e o bloco `<Select>` com avatar+nome (linhas 349-371)
- Remover imports e variáveis não mais utilizados: `Users`, `Shield`, `Select*`, `userInitials`, `currentUser`, `currentRole`, e referências a `users`, `currentUserId`, `setCurrentUser`, `getCurrentUser`, `getRole` do `useUsers()`

O botão "Nova Tarefa" e o botão "Sair" permanecem no canto direito.

