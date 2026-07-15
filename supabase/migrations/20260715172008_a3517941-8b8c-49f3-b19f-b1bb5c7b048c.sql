
CREATE TABLE public.landing_plan_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment text NOT NULL,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  monthly_total numeric NOT NULL DEFAULT 0,
  setup_total numeric NOT NULL DEFAULT 0,
  contact_name text NOT NULL,
  contact_company text,
  contact_phone text NOT NULL,
  contact_email text,
  observacoes text,
  utm jsonb,
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','contatado','convertido','descartado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.landing_plan_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.landing_plan_leads TO authenticated;
GRANT ALL ON public.landing_plan_leads TO service_role;

ALTER TABLE public.landing_plan_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a plan lead"
  ON public.landing_plan_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can read plan leads"
  ON public.landing_plan_leads FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can update plan leads"
  ON public.landing_plan_leads FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete plan leads"
  ON public.landing_plan_leads FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER trg_landing_plan_leads_updated_at
  BEFORE UPDATE ON public.landing_plan_leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
