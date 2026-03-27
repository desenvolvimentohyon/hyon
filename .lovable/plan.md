

## Plano: Corrigir reconhecimento de data do certificado na aba Contabilidade

### Problema
A Edge Function `parse-client-certificate` usa `supabase.auth.getClaims(token)` que **não existe** no supabase-js v2. Isso faz a função retornar erro 401, impedindo o processamento do certificado e o reconhecimento da data de vencimento. A função equivalente `parse-certificate` (usada em Minha Empresa) funciona corretamente porque usa `supabase.auth.getUser()`.

### Solução — 1 arquivo

**`supabase/functions/parse-client-certificate/index.ts`** (linhas 30-39):
- Substituir `supabase.auth.getClaims(token)` por `supabase.auth.getUser()`
- Ajustar extração do `userId` de `claimsData.claims.sub` para `user.id`
- Seguir o mesmo padrão da função `parse-certificate` que já funciona

### Detalhe técnico
```text
Antes:
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  const userId = claimsData.claims.sub;

Depois:
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const userId = user.id;
```

