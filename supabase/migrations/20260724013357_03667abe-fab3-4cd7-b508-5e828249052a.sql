
-- Meetings module
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  meeting_link TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada','realizada','cancelada')),
  internal_user_ids UUID[] NOT NULL DEFAULT '{}',
  external_guests JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  google_event_id TEXT,
  reminded_1d BOOLEAN NOT NULL DEFAULT false,
  reminded_1h BOOLEAN NOT NULL DEFAULT false,
  reminded_15m BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meetings_org_starts ON public.meetings(org_id, starts_at);
CREATE INDEX idx_meetings_internal_users ON public.meetings USING GIN(internal_user_ids);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read org meetings"
  ON public.meetings FOR SELECT TO authenticated
  USING (org_id = public.current_org_id());

CREATE POLICY "Members insert org meetings"
  ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (org_id = public.current_org_id() AND created_by = auth.uid());

CREATE POLICY "Members update org meetings"
  ON public.meetings FOR UPDATE TO authenticated
  USING (org_id = public.current_org_id())
  WITH CHECK (org_id = public.current_org_id());

CREATE POLICY "Members delete org meetings"
  ON public.meetings FOR DELETE TO authenticated
  USING (org_id = public.current_org_id());

CREATE TRIGGER trg_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
