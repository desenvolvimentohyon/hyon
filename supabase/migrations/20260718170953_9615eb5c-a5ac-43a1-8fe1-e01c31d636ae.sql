ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_org_email ON public.profiles (org_id, lower(email));