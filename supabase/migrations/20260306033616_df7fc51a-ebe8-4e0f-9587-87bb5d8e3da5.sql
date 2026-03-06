-- Fix 1: Harden client-attachments storage policies with TO authenticated + org path check
DROP POLICY IF EXISTS "ca_stor_sel" ON storage.objects;
DROP POLICY IF EXISTS "ca_stor_ins" ON storage.objects;
DROP POLICY IF EXISTS "ca_stor_del" ON storage.objects;

CREATE POLICY "ca_stor_sel" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'client-attachments'
    AND (storage.foldername(name))[1] =
      (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ca_stor_ins" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-attachments'
    AND (storage.foldername(name))[1] =
      (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ca_stor_del" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'client-attachments'
    AND (storage.foldername(name))[1] =
      (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));