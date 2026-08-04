-- Corrigir linter 0011_function_search_path_mutable (Segurança)
-- Garantir que as funções usem search_path fixo para evitar ataques de shadowing
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- Corrigir avisos sobre SECURITY DEFINER executáveis por authenticated
-- Revogamos acesso público e autenticado e concedemos apenas o necessário.
-- Como estas funções são auxiliares para RLS, o OWNER (que deve ser superuser/service_role) as executa via políticas.
-- No entanto, has_permission e current_org_id são consumidas pelo frontend (Selects, RPCs).

-- Restringir current_org_id
REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO service_role;

-- Restringir has_permission
REVOKE EXECUTE ON FUNCTION public.has_permission(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(text) TO service_role;
