
-- Remove overly permissive anon policies - we'll use edge function with service role instead
DROP POLICY IF EXISTS "public_select_by_token" ON public.proposals;
DROP POLICY IF EXISTS "public_update_by_token" ON public.proposals;
