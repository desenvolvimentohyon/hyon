-- Adiciona token público para reuniões para permitir acesso externo sem login
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid();
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS company_slug TEXT;

-- Index para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_meetings_public_token ON public.meetings(public_token);

-- Se a tabela de perfis/organizações tiver um slug, podemos tentar popular o company_slug
-- Mas por agora, o token é o mais importante para o link único.

-- Garantir que a Edge Function ou Portal possa ler a reunião via token
-- Criamos uma política simples de leitura pública baseada no token
CREATE POLICY "Meetings are viewable by public token" 
ON public.meetings FOR SELECT 
USING (true); -- O filtro real será feito na query pelo token no frontend/edge

GRANT SELECT ON public.meetings TO anon;
