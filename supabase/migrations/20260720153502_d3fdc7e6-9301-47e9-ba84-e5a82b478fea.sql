
CREATE TABLE public.access_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  sistema TEXT NOT NULL,
  login TEXT,
  senha TEXT,
  url TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_credentials_org ON public.access_credentials(org_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_credentials TO authenticated;
GRANT ALL ON public.access_credentials TO service_role;

ALTER TABLE public.access_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select_access_credentials" ON public.access_credentials
  FOR SELECT TO authenticated USING (org_id = current_org_id());
CREATE POLICY "org_insert_access_credentials" ON public.access_credentials
  FOR INSERT TO authenticated WITH CHECK (org_id = current_org_id());
CREATE POLICY "org_update_access_credentials" ON public.access_credentials
  FOR UPDATE TO authenticated USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());
CREATE POLICY "org_delete_access_credentials" ON public.access_credentials
  FOR DELETE TO authenticated USING (org_id = current_org_id());

CREATE OR REPLACE FUNCTION public.tg_access_credentials_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_access_credentials_updated_at
  BEFORE UPDATE ON public.access_credentials
  FOR EACH ROW EXECUTE FUNCTION public.tg_access_credentials_updated_at();
