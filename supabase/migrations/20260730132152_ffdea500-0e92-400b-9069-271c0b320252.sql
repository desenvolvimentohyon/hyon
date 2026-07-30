CREATE TABLE public.meeting_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  note text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_meeting_history_meeting_id ON public.meeting_history(meeting_id);
CREATE INDEX idx_meeting_history_org_id ON public.meeting_history(org_id);

GRANT SELECT, INSERT ON public.meeting_history TO authenticated;
GRANT ALL ON public.meeting_history TO service_role;

ALTER TABLE public.meeting_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meeting_history_select_org" ON public.meeting_history
FOR SELECT TO authenticated
USING (org_id = public.current_org_id());

CREATE POLICY "meeting_history_insert_org" ON public.meeting_history
FOR INSERT TO authenticated
WITH CHECK (org_id = public.current_org_id() AND changed_by = auth.uid());