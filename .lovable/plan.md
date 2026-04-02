

## Plano: Corrigir erro de constraint ao inativar cliente

### Problema
A tabela `clients` possui um CHECK constraint (`clients_status_check`) que permite apenas: `ativo`, `atraso`, `suspenso`, `cancelado`. O código tenta salvar o status `inativo`, que não está na lista, causando o erro.

### Solução
Adicionar `'inativo'` ao CHECK constraint via migração de banco de dados.

### Alteração

#### 1. Migração de banco de dados
```sql
ALTER TABLE public.clients DROP CONSTRAINT clients_status_check;
ALTER TABLE public.clients ADD CONSTRAINT clients_status_check
  CHECK (status = ANY (ARRAY['ativo','atraso','suspenso','cancelado','inativo']));
```

Nenhuma alteração de código é necessária — o front-end já usa `'inativo'` corretamente.

