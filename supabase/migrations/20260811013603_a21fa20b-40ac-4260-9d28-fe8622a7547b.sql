-- Reforço de Segurança Avançado (GRANTS e Hardening)
-- Versão 2.2.3

-- 1. Revogar acessos públicos de tabelas sensíveis e configurar GRANTS explícitos
-- Isso garante que o role 'anon' não tenha acesso direto, forçando o uso de RLS e Auth.

-- Tabela de Credenciais
REVOKE ALL ON public.access_credentials FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_credentials TO authenticated;
GRANT ALL ON public.access_credentials TO service_role;

-- Tabela de Clientes
REVOKE ALL ON public.clients FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;

-- Tabela Financeira
REVOKE ALL ON public.financial_titles FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_titles TO authenticated;
GRANT ALL ON public.financial_titles TO service_role;

-- Tabela de Tarefas
REVOKE ALL ON public.tasks FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

-- 2. Restringir execução de funções SECURITY DEFINER analíticas
-- Funções que processam dados sensíveis devem ser restritas a roles autenticadas.

REVOKE EXECUTE ON FUNCTION public.calculate_mrr(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_mrr(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.calculate_mrr(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_mrr(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.calculate_churn_rate(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_churn_rate(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.calculate_churn_rate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_churn_rate(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_ia_analytics_summary(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_ia_analytics_summary(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_ia_analytics_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ia_analytics_summary(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.check_user_privilege_escalation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_user_privilege_escalation() FROM anon;
GRANT EXECUTE ON FUNCTION public.check_user_privilege_escalation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_privilege_escalation() TO service_role;

-- 3. Garantir search_path em funções auxiliares de segurança
ALTER FUNCTION public.protect_org_id() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 4. Reforço de RLS em tabelas de integração
-- Asaas Settings deve ser acessível apenas por admins
ALTER TABLE public.asaas_settings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.asaas_settings TO service_role;
REVOKE ALL ON public.asaas_settings FROM anon;

DROP POLICY IF EXISTS "Admins manage asaas settings" ON public.asaas_settings;
CREATE POLICY "Admins manage asaas settings" 
ON public.asaas_settings 
FOR ALL 
TO authenticated 
USING (public.has_permission(auth.uid(), 'manage_settings'));

-- 5. Garantir RLS em tabelas de auditoria
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.notification_logs TO service_role;
REVOKE ALL ON public.notification_logs FROM anon;

DROP POLICY IF EXISTS "Users can view own notification logs" ON public.notification_logs;
CREATE POLICY "Users can view own notification logs" 
ON public.notification_logs 
FOR SELECT 
TO authenticated 
USING (org_id = public.current_org_id());
