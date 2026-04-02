ALTER TABLE public.clients DROP CONSTRAINT clients_status_check;
ALTER TABLE public.clients ADD CONSTRAINT clients_status_check
  CHECK (status = ANY (ARRAY['ativo','atraso','suspenso','cancelado','inativo']));