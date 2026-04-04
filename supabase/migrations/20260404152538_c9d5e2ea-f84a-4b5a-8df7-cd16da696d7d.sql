
CREATE TABLE public.dev_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  description text DEFAULT '',
  stages jsonb NOT NULL DEFAULT '[]',
  checklist jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dev_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dt_select" ON public.dev_templates FOR SELECT TO authenticated
  USING (org_id = current_org_id());

CREATE POLICY "dt_insert" ON public.dev_templates FOR INSERT TO authenticated
  WITH CHECK (org_id = current_org_id() AND has_permission('desenvolvimento:criar'));

CREATE POLICY "dt_update" ON public.dev_templates FOR UPDATE TO authenticated
  USING (org_id = current_org_id() AND has_permission('desenvolvimento:editar'));

CREATE POLICY "dt_delete" ON public.dev_templates FOR DELETE TO authenticated
  USING (org_id = current_org_id() AND has_permission('desenvolvimento:excluir'));

CREATE TRIGGER update_dev_templates_updated_at
  BEFORE UPDATE ON public.dev_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
