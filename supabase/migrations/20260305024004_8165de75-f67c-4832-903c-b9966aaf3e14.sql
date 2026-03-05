
CREATE TABLE public.plan_renewal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  renewal_for_end_date date NOT NULL,
  generated_proposal_id uuid REFERENCES proposals(id),
  proposal_public_token text,
  status text NOT NULL DEFAULT 'pendente',
  auto_generated boolean NOT NULL DEFAULT true,
  whatsapp_sent_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, client_id, renewal_for_end_date)
);

ALTER TABLE public.plan_renewal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prr_select" ON public.plan_renewal_requests FOR SELECT TO authenticated
  USING (org_id = current_org_id());

CREATE POLICY "prr_insert" ON public.plan_renewal_requests FOR INSERT TO authenticated
  WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text])));

CREATE POLICY "prr_update" ON public.plan_renewal_requests FOR UPDATE TO authenticated
  USING ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text])));

CREATE POLICY "prr_delete" ON public.plan_renewal_requests FOR DELETE TO authenticated
  USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.plan_renewal_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE public.proposals
  ADD COLUMN proposal_type text NOT NULL DEFAULT 'new_sale',
  ADD COLUMN reference_end_date date;

ALTER TABLE public.company_profile
  ADD COLUMN renewal_auto_proposal boolean DEFAULT true,
  ADD COLUMN renewal_whatsapp boolean DEFAULT true,
  ADD COLUMN renewal_email boolean DEFAULT false,
  ADD COLUMN renewal_validity_days integer DEFAULT 7,
  ADD COLUMN renewal_same_plan boolean DEFAULT true,
  ADD COLUMN renewal_template text DEFAULT 'Olá {cliente}, segue sua proposta de renovação: {link}';
