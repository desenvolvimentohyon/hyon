
-- Create task-attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false);

-- RLS: authenticated users can upload to their org folder
CREATE POLICY "task_att_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'task-attachments'
  AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid())
);

-- RLS: authenticated users can read from their org folder
CREATE POLICY "task_att_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'task-attachments'
  AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid())
);

-- RLS: authenticated users can delete from their org folder
CREATE POLICY "task_att_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'task-attachments'
  AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid())
);
