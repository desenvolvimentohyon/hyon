ALTER TABLE public.proposals 
  ADD COLUMN IF NOT EXISTS whatsapp_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_send_count integer NOT NULL DEFAULT 0;