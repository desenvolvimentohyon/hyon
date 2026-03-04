
-- Add tracking columns to proposals
ALTER TABLE public.proposals 
  ADD COLUMN IF NOT EXISTS first_viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pdf_downloaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_by_name text;

-- Generate acceptance_link tokens for proposals that don't have one
-- (existing proposals may already have links)

-- Create a public SELECT policy for proposals accessed by acceptance_link token
-- This allows anonymous access to a single proposal by token
CREATE POLICY "public_select_by_token"
ON public.proposals
FOR SELECT
TO anon
USING (acceptance_link IS NOT NULL);

-- Also allow anon to UPDATE acceptance_status and tracking fields
CREATE POLICY "public_update_by_token"
ON public.proposals
FOR UPDATE
TO anon
USING (acceptance_link IS NOT NULL)
WITH CHECK (acceptance_link IS NOT NULL);
