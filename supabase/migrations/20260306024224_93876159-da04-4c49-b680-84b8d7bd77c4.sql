
-- Update financial_titles INSERT policy to also check fine-grained permission
DROP POLICY IF EXISTS "org_insert" ON public.financial_titles;
CREATE POLICY "org_insert" ON public.financial_titles
FOR INSERT TO authenticated
WITH CHECK (
  org_id = current_org_id()
  AND "current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text])
  AND has_permission('financeiro:lancar')
);

-- Update financial_titles UPDATE policy
DROP POLICY IF EXISTS "org_update" ON public.financial_titles;
CREATE POLICY "org_update" ON public.financial_titles
FOR UPDATE TO authenticated
USING (
  org_id = current_org_id()
  AND "current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text])
  AND has_permission('financeiro:lancar')
);

-- Update financial_titles DELETE policy
DROP POLICY IF EXISTS "org_delete" ON public.financial_titles;
CREATE POLICY "org_delete" ON public.financial_titles
FOR DELETE TO authenticated
USING (
  org_id = current_org_id()
  AND "current_role"() = 'admin'::text
  AND has_permission('financeiro:excluir')
);
