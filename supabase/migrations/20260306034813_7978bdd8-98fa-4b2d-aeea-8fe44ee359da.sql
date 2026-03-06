
-- Fix storage policies for logos, certificates, proposal_pdfs buckets
-- Add org-scoped access using the same pattern as client-attachments

-- === LOGOS ===
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

CREATE POLICY "logos_sel" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'logos'
    AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "logos_ins" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos'
    AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "logos_del" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos'
    AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));

-- === CERTIFICATES ===
DROP POLICY IF EXISTS "Authenticated users can upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read certificates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete certificates" ON storage.objects;

CREATE POLICY "certs_sel" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'certificates'
    AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "certs_ins" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates'
    AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "certs_del" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'certificates'
    AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));

-- === PROPOSAL_PDFS ===
DROP POLICY IF EXISTS "Authenticated users can upload proposal_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read proposal_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete proposal_pdfs" ON storage.objects;

CREATE POLICY "pdfs_sel" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'proposal_pdfs'
    AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "pdfs_ins" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proposal_pdfs'
    AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "pdfs_del" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'proposal_pdfs'
    AND (storage.foldername(name))[1] = (SELECT org_id::text FROM public.profiles WHERE id = auth.uid()));
