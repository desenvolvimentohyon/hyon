
CREATE TABLE public.client_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.system_modules(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, module_id)
);

ALTER TABLE public.client_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cm_select" ON public.client_modules FOR SELECT TO authenticated
  USING (org_id = current_org_id());

CREATE POLICY "cm_insert" ON public.client_modules FOR INSERT TO authenticated
  WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY(ARRAY['admin','comercial','suporte','implantacao'])));

CREATE POLICY "cm_delete" ON public.client_modules FOR DELETE TO authenticated
  USING ((org_id = current_org_id()) AND ("current_role"() = ANY(ARRAY['admin','comercial','suporte','implantacao'])));
