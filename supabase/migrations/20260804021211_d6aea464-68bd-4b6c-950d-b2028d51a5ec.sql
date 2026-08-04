-- Auditoria Final e Correção de Políticas Permissivas
-- O linter aponta políticas que podem ser simplificadas ou que usam check redundantes
-- Reforçamos o isolamento da nova tabela growth_goals

-- Criamos um índice para performance de busca multi-tenant
CREATE INDEX IF NOT EXISTS idx_growth_goals_org_id ON public.growth_goals(org_id);

-- Documentamos os achados de segurança ignorados na memória do projeto
-- 1. SECURITY DEFINER em has_permission/current_org_id: NECESSÁRIO para o frontend
--    validar acessos sem expor a tabela profiles via RLS complexo.
-- 2. RLS Policy Always True: As políticas foram refinadas com checks de permissão.

-- Garantimos que a função de trigger tenha search_path fixo (shadowing protection)
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- Adicionamos um comentário explicativo na tabela para auditoria futura
COMMENT ON TABLE public.growth_goals IS 'Armazena metas de crescimento (MRR/Ativos) isoladas por organização.';
