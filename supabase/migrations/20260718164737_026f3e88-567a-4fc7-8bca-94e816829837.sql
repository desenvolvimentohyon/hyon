
DROP POLICY IF EXISTS "Authenticated can read plan leads" ON public.landing_plan_leads;
DROP POLICY IF EXISTS "Authenticated can update plan leads" ON public.landing_plan_leads;
DROP POLICY IF EXISTS "Authenticated can delete plan leads" ON public.landing_plan_leads;

CREATE POLICY "Admins can read plan leads"
  ON public.landing_plan_leads FOR SELECT
  TO authenticated
  USING (public.current_role() = 'admin');

CREATE POLICY "Admins can update plan leads"
  ON public.landing_plan_leads FOR UPDATE
  TO authenticated
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

CREATE POLICY "Admins can delete plan leads"
  ON public.landing_plan_leads FOR DELETE
  TO authenticated
  USING (public.current_role() = 'admin');
