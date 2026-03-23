
ALTER TABLE public.portal_tickets 
ADD COLUMN protocol_number text UNIQUE,
ADD COLUMN tracking_token text UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex');

-- Backfill existing tickets with tracking tokens
UPDATE public.portal_tickets SET tracking_token = encode(extensions.gen_random_bytes(24), 'hex') WHERE tracking_token IS NULL;
