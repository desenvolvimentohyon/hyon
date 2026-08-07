-- Adiciona coluna de presença aos convidados externos (JSONB)
-- A estrutura externa_guests é [{name, email, confirmed?}]

-- Criar função para confirmar presença via token público
CREATE OR REPLACE FUNCTION public.confirm_meeting_attendance(p_token UUID, p_guest_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_guests JSONB;
    v_updated_guests JSONB;
BEGIN
    SELECT external_guests INTO v_guests FROM public.meetings WHERE public_token = p_token;
    
    IF v_guests IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Atualiza o campo 'confirmed' para o convidado com o nome correspondente
    WITH updated AS (
        SELECT jsonb_agg(
            CASE 
                WHEN (elem->>'name') = p_guest_name THEN elem || '{"confirmed": true}'::jsonb
                ELSE elem
            END
        ) as new_list
        FROM jsonb_array_elements(v_guests) as elem
    )
    SELECT new_list INTO v_updated_guests FROM updated;

    UPDATE public.meetings SET external_guests = v_updated_guests WHERE public_token = p_token;
    
    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_meeting_attendance TO anon, authenticated;
