-- Fix plan_accounts: change policies from public to authenticated
DROP POLICY IF EXISTS "plan_accounts_select" ON public.plan_accounts;
DROP POLICY IF EXISTS "plan_accounts_insert" ON public.plan_accounts;
DROP POLICY IF EXISTS "plan_accounts_update" ON public.plan_accounts;
DROP POLICY IF EXISTS "plan_accounts_delete" ON public.plan_accounts;

CREATE POLICY "plan_accounts_select" ON public.plan_accounts
  FOR SELECT TO authenticated
  USING (org_id = current_org_id());

CREATE POLICY "plan_accounts_insert" ON public.plan_accounts
  FOR INSERT TO authenticated
  WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text])));

CREATE POLICY "plan_accounts_update" ON public.plan_accounts
  FOR UPDATE TO authenticated
  USING ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text])));

CREATE POLICY "plan_accounts_delete" ON public.plan_accounts
  FOR DELETE TO authenticated
  USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));