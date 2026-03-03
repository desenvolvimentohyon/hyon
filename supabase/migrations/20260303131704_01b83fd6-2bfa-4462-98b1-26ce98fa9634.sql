
-- 1.1 Partners: add advanced commission fields
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS commission_implant_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_recur_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_recur_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_recur_apply_on text NOT NULL DEFAULT 'on_invoice_paid';

-- Migrate existing data: copy commission_percent to commission_implant_percent
UPDATE public.partners SET commission_implant_percent = commission_percent WHERE commission_implant_percent = 0 AND commission_percent > 0;

-- 1.2 Proposals: add advanced commission fields
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS partner_commission_implant_percent numeric,
  ADD COLUMN IF NOT EXISTS partner_commission_implant_value numeric,
  ADD COLUMN IF NOT EXISTS partner_commission_recur_percent numeric,
  ADD COLUMN IF NOT EXISTS partner_commission_recur_months integer,
  ADD COLUMN IF NOT EXISTS partner_commission_recur_apply_on text;

-- Add commission_implant_generated (keep commission_generated for backward compat)
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS commission_implant_generated boolean NOT NULL DEFAULT false;

-- Migrate existing data
UPDATE public.proposals SET commission_implant_generated = commission_generated WHERE commission_generated = true;
UPDATE public.proposals SET partner_commission_implant_percent = partner_commission_percent WHERE partner_commission_percent IS NOT NULL AND partner_commission_implant_percent IS NULL;
UPDATE public.proposals SET partner_commission_implant_value = partner_commission_value WHERE partner_commission_value IS NOT NULL AND partner_commission_implant_value IS NULL;

-- 1.3 Clients: add partner reference fields
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS ref_partner_id uuid,
  ADD COLUMN IF NOT EXISTS ref_partner_start_at date,
  ADD COLUMN IF NOT EXISTS ref_partner_end_at date,
  ADD COLUMN IF NOT EXISTS ref_partner_recur_percent numeric,
  ADD COLUMN IF NOT EXISTS ref_partner_recur_months integer,
  ADD COLUMN IF NOT EXISTS ref_partner_recur_apply_on text;

-- 1.4 Financial titles: add recurring commission fields
ALTER TABLE public.financial_titles
  ADD COLUMN IF NOT EXISTS reference_title_id uuid,
  ADD COLUMN IF NOT EXISTS commission_type text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_financial_titles_reference_title_id ON public.financial_titles(reference_title_id);
CREATE INDEX IF NOT EXISTS idx_clients_ref_partner_id ON public.clients(ref_partner_id);

-- Unique index for idempotency on recurring commissions
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_commission_recur
  ON public.financial_titles(org_id, commission_type, partner_id, reference_title_id, competency)
  WHERE commission_type IS NOT NULL AND reference_title_id IS NOT NULL;

-- Set existing comissao_parceiro titles as implantacao type
UPDATE public.financial_titles SET commission_type = 'implantacao' WHERE origin = 'comissao_parceiro' AND commission_type IS NULL;
