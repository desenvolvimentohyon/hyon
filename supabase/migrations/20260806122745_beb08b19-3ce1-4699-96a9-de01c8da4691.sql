-- 1) Contract templates storage (base for AI contract generation)
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL DEFAULT public.current_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'saas' CHECK (category IN ('saas','implantacao','desenvolvimento','cartoes','outro')),
  body TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_instructions TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_org ON public.contract_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON public.contract_templates(org_id, active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_templates TO authenticated;
GRANT ALL ON public.contract_templates TO service_role;

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ct_select_own_org" ON public.contract_templates
  FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "ct_insert_own_org" ON public.contract_templates
  FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "ct_update_own_org" ON public.contract_templates
  FOR UPDATE TO authenticated USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "ct_delete_own_org" ON public.contract_templates
  FOR DELETE TO authenticated USING (org_id = public.current_org_id() AND public.has_permission('configuracoes'));

DROP TRIGGER IF EXISTS trg_contract_templates_updated_at ON public.contract_templates;
CREATE TRIGGER trg_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2) Security fix: recovery_plans cross-tenant exposure
UPDATE public.recovery_plans rp
SET org_id = p.org_id
FROM public.profiles p
WHERE p.id = COALESCE(rp.created_by, rp.org_id)
  AND (rp.org_id IS NULL OR rp.org_id NOT IN (SELECT id FROM public.organizations));

DELETE FROM public.recovery_plans
WHERE org_id IS NULL OR org_id NOT IN (SELECT id FROM public.organizations);

ALTER TABLE public.recovery_plans
  ALTER COLUMN org_id SET DEFAULT public.current_org_id(),
  ALTER COLUMN org_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recovery_plans_org_id_fkey'
  ) THEN
    ALTER TABLE public.recovery_plans
      ADD CONSTRAINT recovery_plans_org_id_fkey FOREIGN KEY (org_id)
      REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can view their own recovery plans" ON public.recovery_plans;
DROP POLICY IF EXISTS "Users can insert recovery plans" ON public.recovery_plans;

CREATE POLICY "rp_select_own_org" ON public.recovery_plans
  FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "rp_insert_own_org" ON public.recovery_plans
  FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "rp_update_own_org" ON public.recovery_plans
  FOR UPDATE TO authenticated USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());