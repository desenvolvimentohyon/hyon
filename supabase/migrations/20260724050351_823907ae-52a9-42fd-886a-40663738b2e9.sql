ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_meetings_task_id ON public.meetings(task_id);