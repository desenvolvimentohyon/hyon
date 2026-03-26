

## Plano: Corrigir erro ao excluir cliente

### Problema
Há dois bugs:
1. **Toast de sucesso prematuro**: Em `ClientesReceita.tsx`, a chamada `deleteClienteReceita()` é async mas **não é aguardada** (`await`). O toast "Cliente excluído" aparece imediatamente, antes da operação completar. Quando a operação falha no banco, o `ReceitaContext` mostra o segundo toast "Erro ao excluir cliente" — resultando em dois toasts contraditórios.
2. **Possível falha de RLS**: A operação de soft-delete usa `.update()` na tabela `clients`. A política UPDATE exige role `admin`, `comercial`, `suporte` ou `implantacao`. Se o usuário não tiver uma dessas roles, a operação falhará silenciosamente.

### Alterações

**`src/contexts/ReceitaContext.tsx`**
- Alterar `deleteClienteReceita` para retornar `boolean` indicando sucesso/falha
- Remover o `toast.error` daqui (mover responsabilidade para o chamador)

**`src/pages/ClientesReceita.tsx`**
- Tornar o `onClick` do `AlertDialogAction` **async** com `await`
- Só mostrar toast de sucesso se `deleteClienteReceita` retornar `true`
- Mostrar toast de erro se retornar `false`

### Detalhes técnicos
```
// ReceitaContext — retorna boolean
const deleteClienteReceita = async (id, justificativa) => {
  const { error } = await supabase.from("clients").update({...}).eq("id", id);
  if (error) return false;
  fetchAll();
  return true;
};

// ClientesReceita — aguarda resultado
onClick={async () => {
  const ok = await deleteClienteReceita(deleteTarget.id, deleteJustificativa);
  if (ok) toast({ title: "Cliente excluído" });
  else toast({ title: "Erro ao excluir", variant: "destructive" });
  setDeleteTarget(null);
}}
```

