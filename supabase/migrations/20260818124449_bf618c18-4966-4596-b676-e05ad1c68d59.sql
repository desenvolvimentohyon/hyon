-- 1. Remove blanket public read access on meetings
DROP POLICY IF EXISTS "Meetings are viewable by public token" ON public.meetings;
DROP POLICY IF EXISTS "Public meetings access by token" ON public.meetings;

-- 2. Serve public meeting details only via exact-token lookup, with limited fields
CREATE OR REPLACE FUNCTION public.get_public_meeting(p_token uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'title', m.title,
    'description', m.description,
    'status', m.status,
    'starts_at', m.starts_at,
    'ends_at', m.ends_at,
    'location', m.location,
    'meeting_link', m.meeting_link,
    'external_guests', m.external_guests
  )
  FROM public.meetings m
  WHERE p_token IS NOT NULL AND m.public_token = p_token
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_meeting(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_meeting(uuid) TO anon, authenticated, service_role;

-- 3. Align growth_goals UPDATE read-scope with its write check
DROP POLICY IF EXISTS "org_update_growth_goals" ON public.growth_goals;
CREATE POLICY "org_update_growth_goals"
ON public.growth_goals
FOR UPDATE
TO authenticated
USING (org_id = current_org_id() AND (has_permission('inteligencia:editar') OR has_permission('admin')))
WITH CHECK (org_id = current_org_id() AND (has_permission('inteligencia:editar') OR has_permission('admin')));

-- 4. Remove hardcoded role fallback permissions from legacy has_permission overload
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _user_role text;
    _custom_role_id uuid;
    _org_id uuid;
BEGIN
    SELECT role, custom_role_id, org_id
    INTO _user_role, _custom_role_id, _org_id
    FROM public.profiles
    WHERE id = _user_id;

    IF _org_id IS NULL THEN
        RETURN false;
    END IF;

    IF _user_role = 'admin' THEN
        RETURN true;
    END IF;

    IF _custom_role_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1
            FROM public.role_permissions rp
            JOIN public.permissions p ON p.id = rp.permission_id
            WHERE rp.role_id = _custom_role_id
              AND p.name = _permission_name
              AND p.org_id = _org_id
        );
    END IF;

    -- No implicit permissions: everything must be granted explicitly
    RETURN false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;