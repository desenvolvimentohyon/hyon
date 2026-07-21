
CREATE TABLE public.module_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  min_total_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  allow_bonus BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_module_plans_org ON public.module_plans(org_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_plans TO authenticated;
GRANT ALL ON public.module_plans TO service_role;

ALTER TABLE public.module_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "module_plans_org_select" ON public.module_plans FOR SELECT TO authenticated
  USING (org_id = public.current_org_id());
CREATE POLICY "module_plans_org_insert" ON public.module_plans FOR INSERT TO authenticated
  WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "module_plans_org_update" ON public.module_plans FOR UPDATE TO authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "module_plans_org_delete" ON public.module_plans FOR DELETE TO authenticated
  USING (org_id = public.current_org_id());

CREATE TRIGGER trg_module_plans_updated_at BEFORE UPDATE ON public.module_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


CREATE TABLE public.module_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.module_plans(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.system_modules(id) ON DELETE CASCADE,
  min_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  suggested_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, module_id)
);

CREATE INDEX idx_module_plan_items_plan ON public.module_plan_items(plan_id);
CREATE INDEX idx_module_plan_items_module ON public.module_plan_items(module_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_plan_items TO authenticated;
GRANT ALL ON public.module_plan_items TO service_role;

ALTER TABLE public.module_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "module_plan_items_org_select" ON public.module_plan_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.module_plans mp WHERE mp.id = plan_id AND mp.org_id = public.current_org_id()));
CREATE POLICY "module_plan_items_org_insert" ON public.module_plan_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.module_plans mp WHERE mp.id = plan_id AND mp.org_id = public.current_org_id()));
CREATE POLICY "module_plan_items_org_update" ON public.module_plan_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.module_plans mp WHERE mp.id = plan_id AND mp.org_id = public.current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.module_plans mp WHERE mp.id = plan_id AND mp.org_id = public.current_org_id()));
CREATE POLICY "module_plan_items_org_delete" ON public.module_plan_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.module_plans mp WHERE mp.id = plan_id AND mp.org_id = public.current_org_id()));

CREATE TRIGGER trg_module_plan_items_updated_at BEFORE UPDATE ON public.module_plan_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
