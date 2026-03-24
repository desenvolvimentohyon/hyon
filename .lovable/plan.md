

## Plano: Melhorar PDF da proposta e corrigir link público

### Problemas identificados
1. **PDF sem dados da empresa**: A função `gerarPDFProposta` (usada em PropostaDetalhe e Propostas) passa `cnpj: null`, `logoUrl: null`, `phone: null`, etc. — precisa buscar dados de `company_profile` antes de gerar o PDF
2. **Link abrindo tela de login**: A rota `/proposta/:token` está corretamente fora do `AuthGate`. O problema pode ser que a página mostra erro/vazio (e o usuário interpreta como redirecionamento ao login), ou que o link copiado contém formato incorreto. Vou adicionar tratamento de erro mais claro e validar o fluxo

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/lib/pdfGenerator.ts` | Remover a função `gerarPDFProposta` legada; criar `gerarPDFPropostaComDados` que busca `company_profile` do banco e monta os dados completos (logo, CNPJ, telefone, endereço) |
| `src/pages/PropostaDetalhe.tsx` | Usar nova função que busca company_profile antes de gerar PDF |
| `src/pages/Propostas.tsx` | Usar nova função que busca company_profile antes de gerar PDF |
| `src/pages/PropostaPublica.tsx` | Usar `VITE_SUPABASE_URL` em vez de construir URL manualmente; melhorar tratamento de erros para não mostrar tela vazia |

### Detalhes técnicos

#### 1. Nova função de geração de PDF com dados da empresa
Criar função assíncrona `gerarPDFPropostaComDados(proposta, orgId)` que:
- Busca `company_profile` do Supabase filtrando por `org_id`
- Constrói a URL pública do logo: `${VITE_SUPABASE_URL}/storage/v1/object/public/company-logos/${logo_path}`
- Passa todos os campos (cnpj, telefone, email, endereço, etc.) para `generateProposalPDF`
- Mantém `generateProposalPDF` como função base inalterada

#### 2. Atualizar chamadas nas páginas internas
- `PropostaDetalhe.tsx` e `Propostas.tsx`: trocar `gerarPDFProposta(p, crmConfig)` por `await gerarPDFPropostaComDados(p, orgId)`
- Tornar `handlePDF` async

#### 3. Corrigir acesso à página pública
- Usar `import.meta.env.VITE_SUPABASE_URL` (que já está no .env) em vez de construir a URL com `VITE_SUPABASE_PROJECT_ID`
- Adicionar fallback e mensagem de erro mais clara quando a fetch falha
- Garantir que a página não mostra tela em branco — exibir mensagem de "Proposta não encontrada" com visual adequado

