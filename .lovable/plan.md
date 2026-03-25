

## Plano: Corrigir erro "plan_end_date column not found"

### Problema
Os campos `billing_plan`, `plan_start_date` e `plan_end_date` **não existem como colunas** na tabela `clients` — eles são armazenados dentro do campo `metadata` (JSONB). Porém, o código tenta salvá-los como colunas diretas em 3 lugares, causando o erro.

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/components/clientes/ClienteDetalhe.tsx` | No `handleSave`, interceptar `billing_plan`, `plan_start_date`, `plan_end_date` do `formData` e movê-los para dentro de `changes.metadata` antes de enviar ao banco |
| `src/components/clientes/tabs/TabPagamentos.tsx` | Alterar o `update` (linha 89-93) para salvar esses campos dentro de `metadata` usando merge JSONB, não como colunas diretas |
| `src/hooks/useClienteDetalhe.ts` | No fetch, extrair `billing_plan`, `plan_start_date`, `plan_end_date` do `metadata` para o objeto `ClienteFull` (para manter compatibilidade com a UI) |

### Detalhes técnicos

1. **`ClienteDetalhe.tsx` — `handleSave`**: Antes de chamar `updateCliente`, mover as 3 chaves para `metadata`:
```typescript
const metaKeys = ['billing_plan', 'plan_start_date', 'plan_end_date'];
const metaChanges: Record<string, any> = {};
for (const k of metaKeys) {
  if (k in changes) { metaChanges[k] = (changes as any)[k]; delete (changes as any)[k]; }
}
if (Object.keys(metaChanges).length > 0) {
  changes.metadata = { ...(cliente?.metadata || {}), ...(changes.metadata as any || {}), ...metaChanges };
}
```

2. **`TabPagamentos.tsx`**: Trocar o update direto por merge no `metadata`:
```typescript
const { data: current } = await supabase.from("clients").select("metadata").eq("id", clienteId).single();
await supabase.from("clients").update({
  metadata: { ...(current?.data?.metadata || {}), billing_plan: planType, plan_start_date: startDate, plan_end_date: endDate }
}).eq("id", clienteId);
```

3. **`useClienteDetalhe.ts`**: Após o fetch, extrair os valores do metadata para o objeto retornado, mantendo a interface `ClienteFull` funcional:
```typescript
const meta = cRes.data.metadata || {};
const enriched = { ...cRes.data, billing_plan: meta.billing_plan, plan_start_date: meta.plan_start_date, plan_end_date: meta.plan_end_date };
```

