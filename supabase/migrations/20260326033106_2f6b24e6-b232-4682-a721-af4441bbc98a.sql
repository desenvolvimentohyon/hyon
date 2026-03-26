
-- Step 1: Delete duplicate children (those with parent_id)
DELETE FROM plan_accounts
WHERE id NOT IN (
  SELECT DISTINCT ON (code, name, type) id
  FROM plan_accounts
  ORDER BY code, name, type, created_at ASC
)
AND parent_id IS NOT NULL;

-- Step 2: Delete duplicate parents (those without parent_id)
DELETE FROM plan_accounts
WHERE id NOT IN (
  SELECT DISTINCT ON (code, name, type) id
  FROM plan_accounts
  ORDER BY code, name, type, created_at ASC
)
AND parent_id IS NULL;

-- Step 3: Re-link orphaned children to surviving parent
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
