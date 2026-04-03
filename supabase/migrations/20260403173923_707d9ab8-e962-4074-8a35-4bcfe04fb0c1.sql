
-- 1. Fix privilege escalation: restrict profile self-update to non-role fields
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  AND (
    custom_role_id IS NOT DISTINCT FROM (SELECT p.custom_role_id FROM public.profiles p WHERE p.id = auth.uid())
  )
);

-- 2. Remove overly broad storage policies on proposal_pdfs bucket
DROP POLICY IF EXISTS "Authenticated users can read proposal pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload proposal pdfs" ON storage.objects;

-- 3. Remove overly broad storage policy on logos bucket
DROP POLICY IF EXISTS "Authenticated users can upload to logos" ON storage.objects;
