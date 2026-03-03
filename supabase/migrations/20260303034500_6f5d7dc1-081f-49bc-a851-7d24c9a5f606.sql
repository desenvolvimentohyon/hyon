
-- 1.1 Add ASAAS fields to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS asaas_customer_id text,
  ADD COLUMN IF NOT EXISTS billing_email text,
  ADD COLUMN IF NOT EXISTS billing_phone text,
  ADD COLUMN IF NOT EXISTS billing_document text,
  ADD COLUMN IF NOT EXISTS billing_address_json jsonb;

-- 1.2 Add ASAAS fields to financial_titles
ALTER TABLE public.financial_titles
  ADD COLUMN IF NOT EXISTS asaas_payment_id text,
  ADD COLUMN IF NOT EXISTS asaas_status text,
  ADD COLUMN IF NOT EXISTS asaas_invoice_url text,
  ADD COLUMN IF NOT EXISTS asaas_bank_slip_url text,
  ADD COLUMN IF NOT EXISTS asaas_pix_qr_code text,
  ADD COLUMN IF NOT EXISTS asaas_pix_payload text,
  ADD COLUMN IF NOT EXISTS external_reference text,
  ADD COLUMN IF NOT EXISTS generated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_financial_titles_asaas_payment_id ON public.financial_titles (asaas_payment_id);

-- 1.3 Create asaas_settings
CREATE TABLE IF NOT EXISTS public.asaas_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id),
  environment text NOT NULL DEFAULT 'sandbox',
  default_billing_type text NOT NULL DEFAULT 'BOLETO',
  default_due_days int NOT NULL DEFAULT 7,
  fine_percent numeric,
  interest_percent_month numeric,
  description_template text DEFAULT 'Mensalidade {sistema} - {competencia}',
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asaas_settings_select" ON public.asaas_settings FOR SELECT TO authenticated
  USING (org_id = current_org_id());

CREATE POLICY "asaas_settings_insert" ON public.asaas_settings FOR INSERT TO authenticated
  WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text])));

CREATE POLICY "asaas_settings_update" ON public.asaas_settings FOR UPDATE TO authenticated
  USING ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text])));

CREATE POLICY "asaas_settings_delete" ON public.asaas_settings FOR DELETE TO authenticated
  USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));

CREATE TRIGGER update_asaas_settings_updated_at
  BEFORE UPDATE ON public.asaas_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 1.4 Create asaas_webhook_events
CREATE TABLE IF NOT EXISTS public.asaas_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  event_id text,
  event_type text NOT NULL,
  payment_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asaas_webhook_select" ON public.asaas_webhook_events FOR SELECT TO authenticated
  USING (org_id = current_org_id());

CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_payment_id ON public.asaas_webhook_events (payment_id);
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_processed ON public.asaas_webhook_events (processed);
