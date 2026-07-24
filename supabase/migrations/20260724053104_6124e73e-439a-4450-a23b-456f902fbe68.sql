
ALTER TABLE public.systems_catalog
  ADD COLUMN IF NOT EXISTS setup_override boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS setup_cost_per_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS setup_daily_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS setup_default_days integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS setup_base_fee numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.systems_catalog.setup_override IS
  'Quando true, os parâmetros de implantação abaixo substituem os padrões da empresa para este sistema.';
COMMENT ON COLUMN public.systems_catalog.setup_base_fee IS
  'Taxa fixa de implantação específica do sistema (somada à região).';
