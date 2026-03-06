
-- Create a SECURITY DEFINER function to check fine-grained custom role permissions
-- Returns true if:
--   1. The user has no custom_role_id assigned (backward compatible, falls back to coarse role), OR
--   2. The user's custom role contains the requested permission
CREATE OR REPLACE FUNCTION public.has_permission(_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT
        CASE
          WHEN p.custom_role_id IS NULL THEN true
          ELSE _permission = ANY(cr.permissions)
        END
      FROM public.profiles p
      LEFT JOIN public.custom_roles cr ON cr.id = p.custom_role_id
      WHERE p.id = auth.uid()
    ),
    false
  )
$$;
