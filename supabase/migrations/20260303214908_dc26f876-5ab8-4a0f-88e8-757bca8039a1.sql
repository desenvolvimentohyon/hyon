
-- company_profile table
CREATE TABLE public.company_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  legal_name text,
  trade_name text,
  cnpj text,
  state_registration text,
  municipal_registration text,
  phone text,
  whatsapp text,
  email text,
  website text,
  address_cep text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_uf text,
  tax_regime text,
  cnae text,
  csc_code text,
  certificate_expiration date,
  certificate_number text,
  fiscal_notes text,
  logo_path text,
  logo_dark_path text,
  primary_color text DEFAULT '#3b82f6',
  secondary_color text DEFAULT '#10b981',
  footer_text text,
  institutional_text text,
  default_due_day integer DEFAULT 10,
  proposal_validity_days integer DEFAULT 15,
  default_late_fee_percent numeric DEFAULT 2,
  default_interest_percent numeric DEFAULT 1,
  partner_commission_days integer DEFAULT 7,
  default_billing_message text,
  default_proposal_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cp_select" ON public.company_profile FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "cp_insert" ON public.company_profile FOR INSERT WITH CHECK (org_id = current_org_id() AND "current_role"() = 'admin');
CREATE POLICY "cp_update" ON public.company_profile FOR UPDATE USING (org_id = current_org_id() AND "current_role"() = 'admin');
CREATE POLICY "cp_delete" ON public.company_profile FOR DELETE USING (org_id = current_org_id() AND "current_role"() = 'admin');

CREATE TRIGGER update_company_profile_updated_at
  BEFORE UPDATE ON public.company_profile
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- company_bank_accounts table
CREATE TABLE public.company_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bank_name text NOT NULL DEFAULT '',
  bank_code text,
  agency text,
  account text,
  account_type text DEFAULT 'corrente',
  pix_key text,
  holder_name text,
  holder_document text,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cba_select" ON public.company_bank_accounts FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "cba_insert" ON public.company_bank_accounts FOR INSERT WITH CHECK (org_id = current_org_id() AND "current_role"() = ANY(ARRAY['admin', 'financeiro']));
CREATE POLICY "cba_update" ON public.company_bank_accounts FOR UPDATE USING (org_id = current_org_id() AND "current_role"() = ANY(ARRAY['admin', 'financeiro']));
CREATE POLICY "cba_delete" ON public.company_bank_accounts FOR DELETE USING (org_id = current_org_id() AND "current_role"() = ANY(ARRAY['admin', 'financeiro']));

CREATE TRIGGER update_company_bank_accounts_updated_at
  BEFORE UPDATE ON public.company_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Storage bucket for company logos (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

CREATE POLICY "company_logos_select" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "company_logos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND (SELECT "current_role"()) = 'admin');
CREATE POLICY "company_logos_update" ON storage.objects FOR UPDATE USING (bucket_id = 'company-logos' AND (SELECT "current_role"()) = 'admin');
CREATE POLICY "company_logos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'company-logos' AND (SELECT "current_role"()) = 'admin');
