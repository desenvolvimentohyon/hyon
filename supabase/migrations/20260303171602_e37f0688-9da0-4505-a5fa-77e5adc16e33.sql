
-- 1. Novos campos na tabela clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS trade_name text,
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS state_registration text,
  ADD COLUMN IF NOT EXISTS company_branch_type text DEFAULT 'matriz',
  ADD COLUMN IF NOT EXISTS address_cep text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_complement text,
  ADD COLUMN IF NOT EXISTS address_neighborhood text,
  ADD COLUMN IF NOT EXISTS address_uf text,
  ADD COLUMN IF NOT EXISTS address_reference text,
  ADD COLUMN IF NOT EXISTS primary_contact_name text,
  ADD COLUMN IF NOT EXISTS primary_contact_role text,
  ADD COLUMN IF NOT EXISTS primary_contact_phone text,
  ADD COLUMN IF NOT EXISTS primary_contact_email text,
  ADD COLUMN IF NOT EXISTS primary_contact_best_time text,
  ADD COLUMN IF NOT EXISTS tax_regime text,
  ADD COLUMN IF NOT EXISTS cnae_principal text,
  ADD COLUMN IF NOT EXISTS fiscal_notes text,
  ADD COLUMN IF NOT EXISTS support_type text DEFAULT 'diurno',
  ADD COLUMN IF NOT EXISTS preferred_channel text DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS environment_notes text,
  ADD COLUMN IF NOT EXISTS technical_notes text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS risk_reason text,
  ADD COLUMN IF NOT EXISTS default_due_day integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS contract_start_at date;

-- 2. Tabela client_contacts
CREATE TABLE IF NOT EXISTS public.client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  roles text[] DEFAULT '{}',
  is_billing_preferred boolean DEFAULT false,
  is_support_preferred boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cc_select" ON public.client_contacts
  FOR SELECT USING (org_id = current_org_id());

CREATE POLICY "cc_insert" ON public.client_contacts
  FOR INSERT WITH CHECK (
    org_id = current_org_id()
    AND "current_role"() = ANY(ARRAY['admin','comercial','suporte','implantacao'])
  );

CREATE POLICY "cc_update" ON public.client_contacts
  FOR UPDATE USING (
    org_id = current_org_id()
    AND "current_role"() = ANY(ARRAY['admin','comercial','suporte','implantacao'])
  );

CREATE POLICY "cc_delete" ON public.client_contacts
  FOR DELETE USING (
    org_id = current_org_id()
    AND "current_role"() = ANY(ARRAY['admin','comercial','suporte','implantacao'])
  );

CREATE TRIGGER update_client_contacts_updated_at
  BEFORE UPDATE ON public.client_contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Tabela client_attachments
CREATE TABLE IF NOT EXISTS public.client_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'outros',
  description text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cat_select" ON public.client_attachments
  FOR SELECT USING (org_id = current_org_id());

CREATE POLICY "cat_insert" ON public.client_attachments
  FOR INSERT WITH CHECK (
    org_id = current_org_id()
    AND "current_role"() = ANY(ARRAY['admin','comercial','suporte','implantacao'])
  );

CREATE POLICY "cat_delete" ON public.client_attachments
  FOR DELETE USING (
    org_id = current_org_id()
    AND "current_role"() = ANY(ARRAY['admin','comercial','suporte','implantacao'])
  );

-- 4. Storage bucket para anexos
INSERT INTO storage.buckets (id, name, public) VALUES ('client-attachments', 'client-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "ca_stor_sel" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-attachments');

CREATE POLICY "ca_stor_ins" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'client-attachments');

CREATE POLICY "ca_stor_del" ON storage.objects
  FOR DELETE USING (bucket_id = 'client-attachments');
