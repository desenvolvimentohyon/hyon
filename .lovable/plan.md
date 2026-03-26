

## Plano: Busca automática de CNPJ na aba Dados

### O que muda
Quando o usuário digitar um CNPJ válido (14 dígitos) no campo CNPJ/CPF da aba Dados, o sistema automaticamente consultará os dados da empresa e preencherá os campos: **Nome Fantasia**, **Razão Social**, **Endereço completo** (CEP, logradouro, número, complemento, bairro, cidade, UF), **Email** e **Telefone**.

Um ícone de loading aparecerá no campo durante a consulta. O usuário verá um toast de sucesso ou erro.

### Alterações

**`src/components/clientes/tabs/TabDados.tsx`**

1. Adicionar estado `cnpjLoading` para controlar o loading da busca
2. Importar `validateCNPJ` e `cleanCNPJ` de `@/lib/cnpjUtils`
3. Criar função `buscarCNPJ` que:
   - Limpa e valida o CNPJ (14 dígitos, módulo 11)
   - Chama a edge function `cnpj-lookup` via `supabase.functions.invoke`
   - Preenche automaticamente: `trade_name` (fantasia), `name` (sync), `legal_name` (razão social), endereço completo, email e telefone
   - Mostra toast de sucesso/erro
4. No `onChange` do campo CNPJ/CPF, disparar a busca automaticamente quando o documento tiver 14 dígitos limpos (CNPJ completo)
5. Adicionar ícone `Loader2` animado no campo CNPJ durante a busca

### Detalhes técnicos
- Reutiliza a edge function `cnpj-lookup` já existente (BrasilAPI + fallback ReceitaWS)
- Não sobrescreve campos que o usuário já preencheu manualmente (apenas campos vazios ou se veio da busca)
- A busca só dispara para CNPJ (14 dígitos), não para CPF (11 dígitos)
- Nenhuma alteração de banco necessária

