-- Adicionar colunas para filtros e métricas na tabela recovery_plans
ALTER TABLE public.recovery_plans 
ADD COLUMN IF NOT EXISTS risk_type TEXT DEFAULT 'inadimplencia',
ADD COLUMN IF NOT EXISTS conversion_status TEXT DEFAULT 'pendente' CHECK (conversion_status IN ('pendente', 'em_execucao', 'concluido', 'abortado')),
ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN public.recovery_plans.risk_type IS 'Tipo de risco: inadimplencia, churn, suporte_excessivo, etc.';
COMMENT ON COLUMN public.recovery_plans.conversion_status IS 'Status da conversão/execução do plano estratégico.';
COMMENT ON COLUMN public.recovery_plans.executed_at IS 'Data/hora em que o plano foi marcado como concluído.';
