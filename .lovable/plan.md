

## Plano: Remover contas duplicadas no Plano de Contas

### Problema
A tabela `plan_accounts` contém 115 registros, mas apenas 23 contas únicas. Cada conta está duplicada 5 vezes (5 árvores completas idênticas). Nenhum título financeiro referencia essas contas, então a exclusão é segura.

### Solução
Criar uma migração SQL que:

1. Para cada grupo de duplicatas (mesmo `code`, `name`, `type`), manter apenas o registro com o menor `created_at` (o mais antigo)
2. Deletar primeiro os filhos duplicados (que possuem `parent_id`), depois os pais duplicados (que não possuem `parent_id`), respeitando a foreign key `parent_id`

A migração usará um CTE que identifica os IDs a manter (um por grupo `code+name+type`) e deleta todos os demais em ordem segura.

### Detalhes técnicos

**Migração SQL:**
```sql
-- Delete duplicate children first (those with parent_id)
DELETE FROM plan_accounts
WHERE id NOT IN (
  SELECT DISTINCT ON (code, name, type) id
  FROM plan_accounts
  ORDER BY code, name, type, created_at ASC
)
AND parent_id IS NOT NULL;

-- Then delete duplicate parents (those without parent_id)
DELETE FROM plan_accounts
WHERE id NOT IN (
  SELECT DISTINCT ON (code, name, type) id
  FROM plan_accounts
  ORDER BY code, name, type, created_at ASC
)
AND parent_id IS NULL;

-- Re-link children to the surviving parent
-- Update remaining children whose parent_id was deleted
UPDATE plan_accounts child
SET parent_id = (
  SELECT p.id FROM plan_accounts p
  WHERE p.code = LEFT(child.code, POSITION('.' IN child.code) - 1)
    AND p.parent_id IS NULL
  LIMIT 1
)
WHERE child.parent_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM plan_accounts WHERE id = child.parent_id
);
```

Após a migração, restarão exatamente 23 contas (5 raízes + 18 filhos), sem duplicatas.

