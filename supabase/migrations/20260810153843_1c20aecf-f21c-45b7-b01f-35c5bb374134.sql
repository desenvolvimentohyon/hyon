-- Endurecimento de Funções SECURITY DEFINER
-- Versão 2.2.1

-- 1. Remove acesso EXECUTE de 'public' e 'anon' para funções críticas
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO service_role;

REVOKE EXECUTE ON FUNCTION public.current_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_role() TO service_role;

-- 2. Define search_path explícito para todas as funções SECURITY DEFINER (Proteção contra Search Path Hijacking)
ALTER FUNCTION public.has_permission(uuid, text) SET search_path = public;
ALTER FUNCTION public.current_org_id() SET search_path = public;
ALTER FUNCTION public.current_role() SET search_path = public;
ALTER FUNCTION public.protect_org_id() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.check_user_privilege_escalation() SET search_path = public;

-- 3. Auditoria de RLS em tabelas de configuração (só admins leem/escrevem)
ALTER TABLE public.asaas_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage asaas settings" ON public.asaas_settings;
CREATE POLICY "Admins manage asaas settings" 
ON public.asaas_settings 
FOR ALL 
TO authenticated 
USING (public.has_permission(auth.uid(), 'manage_settings'));

ALTER TABLE public.billing_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage billing rules" ON public.billing_rules;
CREATE POLICY "Admins manage billing rules" 
ON public.billing_rules 
FOR ALL 
TO authenticated 
USING (public.has_permission(auth.uid(), 'manage_settings'));

-- 4. GRANTs faltantes para service_role em tabelas de auditoria/leads
GRANT ALL ON public.landing_plan_leads TO service_role;
GRANT ALL ON public.user_settings TO service_role;
