-- Refino de RLS para evitar o aviso "RLS Policy Always True"
-- O linter às vezes sinaliza políticas que podem ser simplificadas
-- Para a tabela growth_goals, garantimos que todas as políticas de escrita
-- usem checks explícitos de org_id E permissão.

DROP POLICY IF EXISTS "org_insert_growth_goals" ON public.growth_goals;
CREATE POLICY "org_insert_growth_goals" ON public.growth_goals
    FOR INSERT TO authenticated
    WITH CHECK (
        org_id = public.current_org_id() 
        AND (public.has_permission('inteligencia:editar') OR public.has_permission('admin'))
    );

DROP POLICY IF EXISTS "org_update_growth_goals" ON public.growth_goals;
CREATE POLICY "org_update_growth_goals" ON public.growth_goals
    FOR UPDATE TO authenticated
    USING (org_id = public.current_org_id())
    WITH CHECK (
        org_id = public.current_org_id() 
        AND (public.has_permission('inteligencia:editar') OR public.has_permission('admin'))
    );

DROP POLICY IF EXISTS "org_delete_growth_goals" ON public.growth_goals;
CREATE POLICY "org_delete_growth_goals" ON public.growth_goals
    FOR DELETE TO authenticated
    USING (
        org_id = public.current_org_id() 
        AND (public.has_permission('inteligencia:editar') OR public.has_permission('admin'))
    );

-- Corrigindo linter 0028/0029 (SECURITY DEFINER)
-- Algumas funções legadas podem estar sem restrição de execução.
-- Aplicamos revogação em massa para garantir segurança.

DO $$
DECLARE
    func_name text;
BEGIN
    FOR func_name IN (
        SELECT proname 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.prosecdef = true
    )
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I FROM PUBLIC', func_name);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I TO authenticated', func_name);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I TO service_role', func_name);
    END LOOP;
END $$;
