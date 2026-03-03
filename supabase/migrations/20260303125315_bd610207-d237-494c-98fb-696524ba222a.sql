
-- FASE 1: Infraestrutura de Banco de Dados

-- 1. Alterações na tabela clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS portal_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS adjustment_base_date date,
  ADD COLUMN IF NOT EXISTS adjustment_type text,
  ADD COLUMN IF NOT EXISTS adjustment_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS health_score integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS health_status text DEFAULT 'verde';

-- 2. billing_notifications
CREATE TABLE public.billing_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  title_id uuid REFERENCES public.financial_titles(id),
  type text NOT NULL,
  channel text NOT NULL DEFAULT 'interno',
  sent_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bn_select" ON public.billing_notifications FOR SELECT
  USING (org_id = current_org_id());
CREATE POLICY "bn_insert" ON public.billing_notifications FOR INSERT
  WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text])));
CREATE POLICY "bn_delete" ON public.billing_notifications FOR DELETE
  USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));

ALTER PUBLICATION supabase_realtime ADD TABLE public.billing_notifications;

-- 3. billing_rules
CREATE TABLE public.billing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id),
  days_before integer[] DEFAULT '{5}',
  on_due_day boolean DEFAULT true,
  days_after integer[] DEFAULT '{3,7,15}',
  auto_email boolean DEFAULT false,
  auto_whatsapp boolean DEFAULT false,
  auto_task boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "br_select" ON public.billing_rules FOR SELECT
  USING (org_id = current_org_id());
CREATE POLICY "br_insert" ON public.billing_rules FOR INSERT
  WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text])));
CREATE POLICY "br_update" ON public.billing_rules FOR UPDATE
  USING ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text])));
CREATE POLICY "br_delete" ON public.billing_rules FOR DELETE
  USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));

CREATE TRIGGER update_billing_rules_updated_at
  BEFORE UPDATE ON public.billing_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. contract_adjustments
CREATE TABLE public.contract_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  old_value numeric NOT NULL DEFAULT 0,
  new_value numeric NOT NULL DEFAULT 0,
  percent_applied numeric NOT NULL DEFAULT 0,
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.contract_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ca_select" ON public.contract_adjustments FOR SELECT
  USING (org_id = current_org_id());
CREATE POLICY "ca_insert" ON public.contract_adjustments FOR INSERT
  WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'financeiro'::text])));

-- 5. upsell_suggestions
CREATE TABLE public.upsell_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  suggested_module_id uuid REFERENCES public.system_modules(id),
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.upsell_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "us_select" ON public.upsell_suggestions FOR SELECT
  USING (org_id = current_org_id());
CREATE POLICY "us_insert" ON public.upsell_suggestions FOR INSERT
  WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'comercial'::text])));
CREATE POLICY "us_update" ON public.upsell_suggestions FOR UPDATE
  USING ((org_id = current_org_id()) AND ("current_role"() = ANY (ARRAY['admin'::text, 'comercial'::text])));

CREATE TRIGGER update_upsell_suggestions_updated_at
  BEFORE UPDATE ON public.upsell_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_billing_notifications_client ON public.billing_notifications(client_id);
CREATE INDEX idx_billing_notifications_org ON public.billing_notifications(org_id);
CREATE INDEX idx_contract_adjustments_client ON public.contract_adjustments(client_id);
CREATE INDEX idx_upsell_suggestions_client ON public.upsell_suggestions(client_id);
CREATE INDEX idx_clients_portal_token ON public.clients(portal_token);
CREATE INDEX idx_clients_health_score ON public.clients(health_score);
