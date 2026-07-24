-- Step 1: Pricing engine schema fields
ALTER TABLE public.module_plans
  ADD COLUMN IF NOT EXISTS min_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommended BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cycle_discounts JSONB NOT NULL DEFAULT '{"quarterly":5,"annual":10}'::jsonb;

ALTER TABLE public.proposal_settings
  ADD COLUMN IF NOT EXISTS default_cycle_discounts JSONB NOT NULL DEFAULT '{"quarterly":5,"annual":10}'::jsonb;