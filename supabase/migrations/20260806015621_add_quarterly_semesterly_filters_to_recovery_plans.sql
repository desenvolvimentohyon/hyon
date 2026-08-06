-- Migração para filtros temporais e múltiplos destinatários
-- 1. Adicionar campos de data de início/fim e array de destinatários para notificações
ALTER TABLE public.recovery_plans ADD COLUMN IF NOT EXISTS notification_recipients UUID[] DEFAULT ARRAY[]::UUID[];
ALTER TABLE public.recovery_plans ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.recovery_plans ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- 2. Garantir privilégios
GRANT SELECT, UPDATE ON public.recovery_plans TO authenticated;
GRANT ALL ON public.recovery_plans TO service_role;

COMMENT ON COLUMN public.recovery_plans.notification_recipients IS 'IDs de usuários para receber notificações push sobre este plano';
