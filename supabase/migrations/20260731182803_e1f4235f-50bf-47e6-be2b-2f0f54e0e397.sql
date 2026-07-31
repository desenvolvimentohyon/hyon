DROP POLICY "Admin can update any profile in org" ON public.profiles;

CREATE POLICY "Admin can update any profile in org"
ON public.profiles
FOR UPDATE
TO authenticated
USING (org_id = current_org_id() AND "current_role"() = 'admin')
WITH CHECK (org_id = current_org_id() AND "current_role"() = 'admin');