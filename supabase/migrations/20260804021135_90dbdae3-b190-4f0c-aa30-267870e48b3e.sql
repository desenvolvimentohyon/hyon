-- Criar a tabela growth_goals (caso não exista, de forma segura)
CREATE TABLE IF NOT EXISTS public.growth_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL DEFAULT public.current_org_id(),
    system_id uuid REFERENCES public.systems_catalog(id) ON DELETE CASCADE,
    category text NOT NULL CHECK (category IN ('mrr', 'ativos')),
    target_value numeric NOT NULL,
    target_date date NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Garantir acesso ao Data API (PostgREST)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_goals TO authenticated;
GRANT ALL ON public.growth_goals TO service_role;

-- Habilitar RLS
ALTER TABLE public.growth_goals ENABLE ROW LEVEL SECURITY;

-- Políticas de isolamento Multi-tenant (org_id)
-- Nota: Usamos DROP POLICY IF EXISTS para tornar o script idempotente
DROP POLICY IF EXISTS "org_select_growth_goals" ON public.growth_goals;
CREATE POLICY "org_select_growth_goals" ON public.growth_goals
    FOR SELECT TO authenticated
    USING (org_id = public.current_org_id());

DROP POLICY IF EXISTS "org_insert_growth_goals" ON public.growth_goals;
CREATE POLICY "org_insert_growth_goals" ON public.growth_goals
    FOR INSERT TO authenticated
    WITH CHECK (
        org_id = public.current_org_id() AND 
        public.has_permission('inteligencia:editar')
    );

DROP POLICY IF EXISTS "org_update_growth_goals" ON public.growth_goals;
CREATE POLICY "org_update_growth_goals" ON public.growth_goals
    FOR UPDATE TO authenticated
    USING (org_id = public.current_org_id())
    WITH CHECK (
        org_id = public.current_org_id() AND 
        public.has_permission('inteligencia:editar')
    );

DROP POLICY IF EXISTS "org_delete_growth_goals" ON public.growth_goals;
CREATE POLICY "org_delete_growth_goals" ON public.growth_goals
    FOR DELETE TO authenticated
    USING (
        org_id = public.current_org_id() AND 
        public.has_permission('inteligencia:editar')
    );

-- Trigger para updated_at automático (Usando função genérica)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_growth_goals_updated_at ON public.growth_goals;
CREATE TRIGGER handle_growth_goals_updated_at
    BEFORE UPDATE ON public.growth_goals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
