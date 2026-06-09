-- Restringir execução de funções SECURITY DEFINER
DO $$ 
DECLARE 
    func_name record;
BEGIN
    FOR func_name IN 
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I FROM PUBLIC', func_name.routine_name);
        EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I FROM anon', func_name.routine_name);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I TO authenticated, service_role', func_name.routine_name);
    END LOOP;
END $$;

-- Ajustar políticas de storage para evitar listagem pública se aplicável
-- Nota: Isso depende do nome dos buckets, mas seguindo o padrão de 'task-attachments' e 'client-attachments'
DO $$ 
BEGIN
    -- Task Attachments
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public list') THEN
        DROP POLICY "Public list" ON storage.objects;
    END IF;
END $$;
