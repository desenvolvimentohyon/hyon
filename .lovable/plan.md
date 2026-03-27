

## Plano: Adicionar coluna `quantity` à tabela `client_modules`

### Causa Raiz

A tabela `client_modules` no banco de dados possui apenas: `id`, `org_id`, `client_id`, `module_id`, `created_at`. Não existe a coluna `quantity`.

O código em `TabCusto.tsx`, `TabModulos.tsx` e `TabDados.tsx` faz queries como:
```
SELECT module_id, quantity FROM client_modules WHERE client_id = ...
```
Isso retorna **erro 400** (`column client_modules.quantity does not exist`), fazendo com que todos os módulos e custos apareçam zerados.

### Correção

**1. Migração de banco de dados**
```sql
ALTER TABLE public.client_modules 
ADD COLUMN quantity integer NOT NULL DEFAULT 1;
```

Apenas isso. Uma única coluna com default 1 (todos os registros existentes ganham quantidade 1 automaticamente).

### Arquivo afetado
Nenhum arquivo de código precisa ser alterado — o código já está correto, só falta a coluna no banco.

