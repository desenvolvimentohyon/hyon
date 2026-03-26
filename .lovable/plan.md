

## Plano: Sincronizar campo `name` com `trade_name` para clientes existentes

### Contexto
O campo `name` foi removido da UI e agora é preenchido automaticamente com `trade_name` ao salvar. Porém, clientes já existentes podem ter `name` diferente de `trade_name`. Precisamos atualizar o banco para manter consistência.

### Alteração

**Migração SQL** (via migration tool):
```sql
UPDATE public.clients
SET name = trade_name
WHERE trade_name IS NOT NULL
  AND trade_name != '';
```

Isso atualiza todos os clientes existentes que possuem `trade_name` preenchido, igualando `name` ao `trade_name`.

### Detalhes técnicos
- Apenas uma migração, sem alteração de código
- Clientes sem `trade_name` mantêm o `name` atual (não há risco de NULL no campo NOT NULL)
- Novos salvamentos já fazem essa sincronização automaticamente via UI

