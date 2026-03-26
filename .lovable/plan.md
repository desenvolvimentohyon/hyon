

## Correção: Despesa criada mas não aparece nos lançamentos

### Problema identificado

Há dois bugs trabalhando juntos:

1. **`handleSave` não aguarda o resultado de `addTitulo`**: A função `addTitulo` é assíncrona, mas o `handleSave` não usa `await`. O toast de sucesso ("Despesa registrada!") aparece imediatamente, ANTES do insert no banco terminar. Se o insert falhar, o toast de erro aparece DEPOIS do de sucesso, o que confunde o usuário.

2. **`addTitulo` não retorna indicação de sucesso/falha**: A função retorna `void`, impossibilitando que o chamador saiba se deu certo.

3. **`value_final` não é preenchido no insert**: O campo existe na tabela com default 0, mas deveria refletir o valor original do lançamento.

### Alterações

**`src/contexts/FinanceiroContext.tsx`**
- Alterar `addTitulo` para retornar `Promise<boolean>` (true = sucesso, false = erro)
- Adicionar `value_final` no payload do insert, igualando a `value_original`

**`src/pages/financeiro/Lancamentos.tsx`**
- Tornar `handleSave` async
- Usar `await` no `addTitulo` e verificar o retorno
- Mostrar toast de sucesso somente se retornar `true`
- Limpar campos somente em caso de sucesso

### Detalhe técnico

```tsx
// FinanceiroContext.tsx — addTitulo retorna boolean
const addTitulo = useCallback(async (...): Promise<boolean> => {
  if (!orgId) return false;
  const { error } = await supabase.from("financial_titles").insert({
    ...campos,
    value_final: t.valorOriginal, // novo
  } as any);
  if (error) { toast.error("Erro ao criar título: " + error.message); return false; }
  fetchAll();
  return true;
}, [...]);

// Lancamentos.tsx — handleSave aguarda resultado
const handleSave = async () => {
  if (!desc || !valor) { toast.error("..."); return; }
  const success = await addTitulo({...});
  if (success) {
    toast.success("Despesa registrada!");
    setDesc(""); setValor(""); setObs("");
  }
};
```

