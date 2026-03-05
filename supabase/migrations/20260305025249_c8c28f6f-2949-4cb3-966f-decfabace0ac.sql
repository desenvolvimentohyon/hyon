
CREATE TABLE public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  type text NOT NULL,
  channel text NOT NULL,
  target text,
  plan_end_date date NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, client_id, type, channel, plan_end_date)
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nl_select" ON public.notification_logs FOR SELECT TO authenticated
  USING (org_id = current_org_id());

CREATE POLICY "nl_insert" ON public.notification_logs FOR INSERT TO authenticated
  WITH CHECK (org_id = current_org_id() AND "current_role"() IN ('admin', 'financeiro'));

ALTER TABLE public.company_profile
  ADD COLUMN IF NOT EXISTS renewal_alert_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS renewal_alert_days integer DEFAULT 7,
  ADD COLUMN IF NOT EXISTS renewal_whatsapp_template text,
  ADD COLUMN IF NOT EXISTS renewal_email_template text;
