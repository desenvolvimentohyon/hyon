-- Revogar acessos públicos remanescentes de funções SECURITY DEFINER
-- Versão 2.2.4

-- protect_org_id (Trigger function)
REVOKE EXECUTE ON FUNCTION public.protect_org_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_org_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.protect_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.protect_org_id() TO service_role;

-- handle_new_user (Auth trigger)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- has_permission(text) - Overload
REVOKE EXECUTE ON FUNCTION public.has_permission(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_permission(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(text) TO service_role;

-- get_user_permissions(uuid)
REVOKE EXECUTE ON FUNCTION public.get_user_permissions(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_permissions(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid) TO service_role;

-- Garantir search_path em todas (redundância de segurança)
ALTER FUNCTION public.protect_org_id() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.has_permission(text) SET search_path = public;
ALTER FUNCTION public.get_user_permissions(uuid) SET search_path = public;
