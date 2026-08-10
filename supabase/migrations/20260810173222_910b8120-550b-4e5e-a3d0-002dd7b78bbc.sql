-- Reforço de Segurança Avançado (RLS e Integridade)
-- Versão 2.2.2

-- 1. Estender a proteção de org_id para outras tabelas financeiras e de clientes
DO $$ 
BEGIN 
    -- Tabela de Clientes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
        DROP TRIGGER IF EXISTS tr_protect_clients_org ON public.clients;
        CREATE TRIGGER tr_protect_clients_org
        BEFORE UPDATE ON public.clients
        FOR EACH ROW EXECUTE FUNCTION public.protect_org_id();
    END IF;

    -- Tabela de Transações Bancárias
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bank_transactions') THEN
        DROP TRIGGER IF EXISTS tr_protect_bank_transactions_org ON public.bank_transactions;
        CREATE TRIGGER tr_protect_bank_transactions_org
        BEFORE UPDATE ON public.bank_transactions
        FOR EACH ROW EXECUTE FUNCTION public.protect_org_id();
    END IF;

    -- Tabela de Credenciais (Crítico)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_credentials') THEN
        DROP TRIGGER IF EXISTS tr_protect_access_credentials_org ON public.access_credentials;
        CREATE TRIGGER tr_protect_access_credentials_org
        BEFORE UPDATE ON public.access_credentials
        FOR EACH ROW EXECUTE FUNCTION public.protect_org_id();
    END IF;

    -- Tabela de Tarefas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        DROP TRIGGER IF EXISTS tr_protect_tasks_org ON public.tasks;
        CREATE TRIGGER tr_protect_tasks_org
        BEFORE UPDATE ON public.tasks
        FOR EACH ROW EXECUTE FUNCTION public.protect_org_id();
    END IF;
END $$;

-- 2. Reforço de RLS para access_credentials
ALTER TABLE public.access_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_select_access_credentials" ON public.access_credentials;
CREATE POLICY "org_select_access_credentials" 
ON public.access_credentials 
FOR SELECT 
TO authenticated 
USING (
    org_id = public.current_org_id() 
    AND (
        public.has_permission(auth.uid(), 'view_credentials')
        OR created_by = auth.uid()
    )
);

DROP POLICY IF EXISTS "org_insert_access_credentials" ON public.access_credentials;
CREATE POLICY "org_insert_access_credentials" 
ON public.access_credentials 
FOR INSERT 
TO authenticated 
WITH CHECK (
    org_id = public.current_org_id()
);

DROP POLICY IF EXISTS "org_update_access_credentials" ON public.access_credentials;
CREATE POLICY "org_update_access_credentials" 
ON public.access_credentials 
FOR UPDATE 
TO authenticated 
USING (
    org_id = public.current_org_id() 
    AND (
        public.has_permission(auth.uid(), 'manage_credentials')
        OR created_by = auth.uid()
    )
);

-- 3. Proteção adicional para a tabela de logs/webhook do ASAAS
ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.asaas_webhook_events TO service_role;
REVOKE ALL ON public.asaas_webhook_events FROM anon;

DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.asaas_webhook_events;
CREATE POLICY "Admins can view webhook logs" 
ON public.asaas_webhook_events 
FOR SELECT 
TO authenticated 
USING (public.has_permission(auth.uid(), 'manage_settings'));

-- 4. GRANTs de segurança para tabelas de configuração e metadados
GRANT ALL ON public.asaas_settings TO service_role;
GRANT ALL ON public.billing_rules TO service_role;
GRANT ALL ON public.custom_roles TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.organizations TO service_role;
