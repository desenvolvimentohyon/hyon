ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS contract_body TEXT,
  ADD COLUMN IF NOT EXISTS contract_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_signer_name TEXT,
  ADD COLUMN IF NOT EXISTS contract_signer_ip TEXT;

CREATE INDEX IF NOT EXISTS idx_proposals_contract_template ON public.proposals(contract_template_id);