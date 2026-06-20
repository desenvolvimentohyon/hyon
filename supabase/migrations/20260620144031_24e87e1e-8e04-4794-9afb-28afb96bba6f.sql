
CREATE OR REPLACE FUNCTION public.has_permission(_permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (
      SELECT
        CASE
          WHEN p.custom_role_id IS NULL THEN p.role = 'admin'
          ELSE _permission = ANY(cr.permissions)
        END
      FROM public.profiles p
      LEFT JOIN public.custom_roles cr ON cr.id = p.custom_role_id
      WHERE p.id = auth.uid()
    ),
    false
  )
$function$;

REVOKE EXECUTE ON FUNCTION public.has_permission(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_permissions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid) TO authenticated;

DROP POLICY IF EXISTS company_logos_select ON storage.objects;
CREATE POLICY company_logos_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'company-logos');
