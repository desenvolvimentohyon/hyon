ALTER TABLE public.recovery_plans ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
GRANT ALL ON public.recovery_plans TO authenticated;
GRANT ALL ON public.recovery_plans TO service_role;