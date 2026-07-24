ALTER TABLE public.module_plans
  ADD COLUMN IF NOT EXISTS system_id uuid REFERENCES public.systems_catalog(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_module_plans_system_id ON public.module_plans(system_id);