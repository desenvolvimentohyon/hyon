ALTER TABLE public.recovery_plans ADD COLUMN IF NOT EXISTS severity TEXT CHECK (severity IN ('baixo', 'medio', 'alto')) DEFAULT 'medio';
UPDATE public.recovery_plans SET severity = 'medio' WHERE severity IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recovery_plans TO authenticated;
GRANT ALL ON public.recovery_plans TO service_role;