-- Auditoria e Reforço de Segurança (RLS e Permissões)
-- Versão 2.2.0

-- 1. Garante que a função has_permission não pode ser burlada e respeita o isolamento por org_id
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _user_role text; -- Usando text pois app_role não existe como tipo enum global
    _custom_role_id uuid;
    _org_id uuid;
BEGIN
    -- Busca o perfil do usuário
    SELECT role, custom_role_id, org_id 
    INTO _user_role, _custom_role_id, _org_id
    FROM public.profiles 
    WHERE id = _user_id;

    -- Se não encontrar perfil, nega
    IF _org_id IS NULL THEN
        RETURN false;
    END IF;

    -- Admins têm acesso total
    IF _user_role = 'admin' THEN
        RETURN true;
    END IF;

    -- Se tiver role customizada, verifica na tabela de permissões de roles
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

    -- Fallback: permissões básicas baseadas na role fixa
    RETURN CASE 
        WHEN _user_role = 'suporte' THEN 
            _permission_name IN ('view_tasks', 'edit_tasks', 'view_clients', 'view_support')
        WHEN _user_role = 'comercial' THEN 
            _permission_name IN ('view_proposals', 'create_proposals', 'view_clients', 'view_crm')
        ELSE false
    END;
END;
$$;

-- 2. Reforço de RLS na tabela landing_plan_leads para evitar spam/vazamento
ALTER TABLE public.landing_plan_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for anonymous users" ON public.landing_plan_leads;
CREATE POLICY "Enable insert for anonymous users" 
ON public.landing_plan_leads 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view leads" ON public.landing_plan_leads;
CREATE POLICY "Admins can view leads" 
ON public.landing_plan_leads 
FOR SELECT 
TO authenticated 
USING (public.has_permission(auth.uid(), 'view_leads'));

-- 3. Correção de permissão GRANT nas tabelas críticas que podem estar faltando
GRANT SELECT, INSERT, UPDATE, DELETE ON public.landing_plan_leads TO authenticated;
GRANT ALL ON public.landing_plan_leads TO service_role;
GRANT INSERT ON public.landing_plan_leads TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_credentials TO authenticated;
GRANT ALL ON public.access_credentials TO service_role;

-- 4. Proteção contra modificação de org_id por usuários não-admins
CREATE OR REPLACE FUNCTION public.protect_org_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Apenas admins podem alterar org_id
    IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'admin' THEN
        IF NEW.org_id != OLD.org_id THEN
            RAISE EXCEPTION 'Apenas administradores podem alterar a organização de um registro.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Aplicar o trigger em tabelas críticas (Exemplo: financial_titles)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_titles') THEN
        DROP TRIGGER IF EXISTS tr_protect_financial_titles_org ON public.financial_titles;
        CREATE TRIGGER tr_protect_financial_titles_org
        BEFORE UPDATE ON public.financial_titles
        FOR EACH ROW EXECUTE FUNCTION public.protect_org_id();
    END IF;
END $$;
