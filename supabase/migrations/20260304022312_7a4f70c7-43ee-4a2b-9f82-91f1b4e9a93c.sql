
-- Support tickets from portal clients
CREATE TABLE public.portal_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  client_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'aberto',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pt_select" ON public.portal_tickets FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "pt_insert" ON public.portal_tickets FOR INSERT WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY(ARRAY['admin'::text,'suporte'::text,'implantacao'::text])));
CREATE POLICY "pt_update" ON public.portal_tickets FOR UPDATE USING ((org_id = current_org_id()) AND ("current_role"() = ANY(ARRAY['admin'::text,'suporte'::text,'implantacao'::text])));
CREATE POLICY "pt_delete" ON public.portal_tickets FOR DELETE USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));

CREATE TRIGGER update_portal_tickets_updated_at BEFORE UPDATE ON public.portal_tickets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Ticket messages
CREATE TABLE public.portal_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.portal_tickets(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  sender_type text NOT NULL DEFAULT 'client',
  sender_name text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ptm_select" ON public.portal_ticket_messages FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "ptm_insert" ON public.portal_ticket_messages FOR INSERT WITH CHECK ((org_id = current_org_id()) AND ("current_role"() = ANY(ARRAY['admin'::text,'suporte'::text,'implantacao'::text])));
CREATE POLICY "ptm_delete" ON public.portal_ticket_messages FOR DELETE USING ((org_id = current_org_id()) AND ("current_role"() = 'admin'::text));

-- Client suggestions
CREATE TABLE public.portal_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  client_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'nova',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ps_select" ON public.portal_suggestions FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "ps_insert" ON public.portal_suggestions FOR INSERT WITH CHECK (org_id = current_org_id());
CREATE POLICY "ps_update" ON public.portal_suggestions FOR UPDATE USING ((org_id = current_org_id()) AND ("current_role"() = ANY(ARRAY['admin'::text,'suporte'::text])));

-- Client referrals
CREATE TABLE public.portal_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  client_id uuid NOT NULL,
  company_name text NOT NULL,
  contact_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pr_select" ON public.portal_referrals FOR SELECT USING (org_id = current_org_id());
CREATE POLICY "pr_insert" ON public.portal_referrals FOR INSERT WITH CHECK (org_id = current_org_id());
CREATE POLICY "pr_update" ON public.portal_referrals FOR UPDATE USING ((org_id = current_org_id()) AND ("current_role"() = ANY(ARRAY['admin'::text,'comercial'::text])));

-- Onboarding progress tracking column
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS onboarding_completed_steps text[] NOT NULL DEFAULT '{}';
