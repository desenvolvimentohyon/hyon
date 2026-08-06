-- Trigger para auto-popular client_id em registros legados via heurística de nome no source_insight
CREATE OR REPLACE FUNCTION public.fn_populate_recovery_client_id()
RETURNS TRIGGER AS $$
DECLARE
    found_client_id UUID;
    insight_text TEXT;
BEGIN
    -- Só tenta se o client_id estiver nulo
    IF NEW.client_id IS NULL AND NEW.source_insight IS NOT NULL THEN
        -- Tenta extrair o nome do cliente do insight (assume formato "Cliente: NOME")
        insight_text := NEW.source_insight;
        
        SELECT id INTO found_client_id
        FROM public.clients
        WHERE name ILIKE '%' || split_part(split_part(insight_text, 'Cliente:', 2), '\n', 1) || '%'
        LIMIT 1;

        IF found_client_id IS NOT NULL THEN
            NEW.client_id := found_client_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_populate_recovery_client_id ON public.recovery_plans;
CREATE TRIGGER tr_populate_recovery_client_id
    BEFORE INSERT OR UPDATE ON public.recovery_plans
    FOR EACH ROW EXECUTE FUNCTION public.fn_populate_recovery_client_id();

-- Atualizar registros existentes que estão sem client_id
DO $$
DECLARE
    r RECORD;
    found_id UUID;
BEGIN
    FOR r IN SELECT id, source_insight FROM public.recovery_plans WHERE client_id IS NULL AND source_insight IS NOT NULL LOOP
        SELECT id INTO found_id
        FROM public.clients
        WHERE name ILIKE '%' || trim(split_part(split_part(r.source_insight, 'Cliente:', 2), E'\n', 1)) || '%'
        LIMIT 1;
        
        IF found_id IS NOT NULL THEN
            UPDATE public.recovery_plans SET client_id = found_id WHERE id = r.id;
        END IF;
    END LOOP;
END $$;
