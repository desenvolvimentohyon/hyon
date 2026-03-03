
-- 1. Create partners table
CREATE TABLE public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  document text,
  phone text,
  email text,
  active boolean NOT NULL DEFAULT true,
  commission_percent numeric NOT NULL DEFAULT 0,
  commission_type text NOT NULL DEFAULT 'apenas_implantacao',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners_select" ON public.partners FOR SELECT
  USING (org_id = current_org_id());

CREATE POLICY "partners_insert" ON public.partners FOR INSERT
  WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text, 'comercial'::text])));

CREATE POLICY "partners_update" ON public.partners FOR UPDATE
  USING ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text, 'comercial'::text])));

CREATE POLICY "partners_delete" ON public.partners FOR DELETE
  USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));

CREATE TRIGGER handle_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add columns to proposals
ALTER TABLE public.proposals
  ADD COLUMN partner_id uuid REFERENCES public.partners(id),
  ADD COLUMN partner_commission_percent numeric,
  ADD COLUMN partner_commission_value numeric,
  ADD COLUMN commission_generated boolean NOT NULL DEFAULT false;

-- Add columns to financial_titles
ALTER TABLE public.financial_titles
  ADD COLUMN partner_id uuid,
  ADD COLUMN reference_proposal_id uuid;

-- Indexes
CREATE INDEX idx_partners_org_id ON public.partners(org_id);
CREATE INDEX idx_financial_titles_partner_id ON public.financial_titles(partner_id);
CREATE INDEX idx_financial_titles_reference_proposal_id ON public.financial_titles(reference_proposal_id);
