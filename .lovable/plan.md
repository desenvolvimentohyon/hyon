

## Plano: Corrigir página pública da proposta (link, logo, informações da empresa)

### Problema raiz
O link copiado aponta para `/aceite/PROP-2026-XXXX`, que usa o componente `AceiteProposta` (uma página simples do contexto). A página rica `PropostaPublica` fica em `/proposta/:token`, mas o `acceptance_link` armazenado no banco é `/aceite/PROP-2026-XXXX`, então a edge function nunca encontra a proposta quando acessada via `/proposta/`.

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/contexts/PropostasContext.tsx` | Mudar `acceptance_link` para armazenar apenas o número da proposta (ex: `PROP-2026-0001`) e mudar `linkAceite` para apontar para `/proposta/{numero}` |
| `src/pages/Propostas.tsx` | Atualizar link copiado para usar `/proposta/{token}` |
| `src/pages/PropostaDetalhe.tsx` | Atualizar link copiado para usar `/proposta/{token}` |
| `supabase/functions/public-proposal/index.ts` | Buscar por `acceptance_link = token` OU `proposal_number = token` para compatibilidade com propostas existentes |
| `src/pages/PropostaPublica.tsx` | Adicionar logo da empresa no header (imagem real do storage); adicionar seção com dados da empresa (CNPJ, endereço, contato) visível na página |
| `src/App.tsx` | Remover rota duplicada `/aceite/:numero` do AuthGate (manter apenas no nível raiz); redirecionar `/aceite/:numero` para `/proposta/:numero` |

### Detalhes técnicos

#### 1. Corrigir armazenamento do acceptance_link
- `PropostasContext.tsx` linha 127: mudar de `acceptance_link: \`/aceite/${numero}\`` para `acceptance_link: numero`
- Linha 24: mudar `linkAceite` para `/proposta/${r.acceptance_link || r.proposal_number}`

#### 2. Edge function: busca flexível
- Alterar a query para buscar por `acceptance_link` OU `proposal_number` para funcionar com propostas antigas e novas

#### 3. Logo real no header da página pública
- No header (linha 400-406), substituir o quadrado colorido com inicial por uma `<img>` quando `company.logo_path` existir, usando URL pública do bucket `company-logos`

#### 4. Seção de informações da empresa
- Adicionar bloco visual entre o hero e o pricing card com: logo grande, nome da empresa, CNPJ, endereço formatado, telefone, email, site
- Usar o `institutional_text` se disponível

#### 5. Redirecionar /aceite para /proposta
- No `App.tsx`, trocar a rota `/aceite/:numero` para fazer redirect para `/proposta/:numero`

