DROP POLICY IF EXISTS company_logos_select ON storage.objects;
CREATE POLICY company_logos_select ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = (
    SELECT profiles.org_id::text FROM public.profiles WHERE profiles.id = auth.uid()
  )
);