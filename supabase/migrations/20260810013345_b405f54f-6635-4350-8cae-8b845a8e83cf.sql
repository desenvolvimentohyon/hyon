-- Segurança Adicional: Bloqueio de modificação de role e org_id por usuários comuns
CREATE OR REPLACE FUNCTION public.check_user_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.role() = 'authenticated' AND (
        SELECT role FROM public.profiles WHERE id = auth.uid()
    ) != 'admin' THEN
        IF NEW.role IS DISTINCT FROM OLD.role OR NEW.custom_role_id IS DISTINCT FROM OLD.custom_role_id THEN
            RAISE EXCEPTION 'Permissão negada para alterar cargo/função.';
        END IF;
        
        IF NEW.org_id IS DISTINCT FROM OLD.org_id THEN
            RAISE EXCEPTION 'Não é permitido alterar a organização.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_check_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.check_user_privilege_escalation();

-- RLS Estrito para acessos externos (meetings)
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public meetings access by token" ON public.meetings;
CREATE POLICY "Public meetings access by token"
ON public.meetings
FOR SELECT
TO anon, authenticated
USING (public_token IS NOT NULL);

DROP POLICY IF EXISTS "Only authenticated can manage meetings" ON public.meetings;
CREATE POLICY "Only authenticated can manage meetings"
ON public.meetings
FOR ALL
TO authenticated
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

GRANT SELECT ON public.meetings TO anon;
GRANT ALL ON public.meetings TO service_role;
