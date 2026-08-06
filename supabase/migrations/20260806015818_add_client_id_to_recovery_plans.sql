-- Adicionar client_id à tabela recovery_plans para análises financeiras precisas
ALTER TABLE public.recovery_plans ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Garantir privilégios
GRANT SELECT, INSERT, UPDATE ON public.recovery_plans TO authenticated;
GRANT ALL ON public.recovery_plans TO service_role;

COMMENT ON COLUMN public.recovery_plans.client_id IS 'Vínculo com o cliente para rastreamento de MRR e impacto financeiro';
