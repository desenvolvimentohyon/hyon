-- Re-run column addition to ensure public_token exists
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid();
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS company_slug TEXT;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_meetings_public_token ON public.meetings(public_token);

-- Drop existing if any and recreate policy correctly
DROP POLICY IF EXISTS "Meetings are viewable by public token" ON public.meetings;

CREATE POLICY "Meetings are viewable by public token" 
ON public.meetings FOR SELECT 
TO anon, authenticated
USING (public_token IS NOT NULL);

GRANT SELECT ON public.meetings TO anon;
GRANT SELECT ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
