

## Plano: Corrigir erro na importação do certificado digital

### Problema
Os logs mostram que a versão **deployada** da Edge Function `parse-certificate` ainda contém `supabase.auth.getClaims()` (que não existe), apesar do arquivo no código-fonte já usar `getUser()`. A função precisa ser redeployada.

Além disso, a importação `npm:node-forge@1.3.1` pode causar problemas em Edge Functions. Vou adicionar tratamento mais robusto para garantir estabilidade.

### Alterações

**`supabase/functions/parse-certificate/index.ts`**
- Forçar redeploy fazendo uma alteração mínima (adicionar log de diagnóstico no catch)
- Melhorar o log de erro para incluir `e.stack` além de `e.message`, facilitando debug futuro
- Garantir que a conversão de datas use fallback seguro caso `toISOString()` falhe

Nenhuma outra alteração necessária — o componente `CertificadoDigitalUpload.tsx` já reconhece as datas automaticamente (`cert_valid_from`, `cert_valid_to`) e as exibe na UI.

### Detalhes técnicos
- A função já salva `cert_valid_from`, `cert_valid_to` e `certificate_expiration` na tabela `company_profile`
- O componente já lê e exibe essas datas com alertas de vencimento
- O problema é exclusivamente de deploy — o código correto não foi propagado

