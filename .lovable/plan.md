

## Plano: Validação de CNPJ com feedback visual no cadastro de clientes

### Situação atual
O formulário já aplica máscara (`maskDocument`) e valida (`validateCNPJ`) para disparar a consulta automática. Porém **não há feedback visual de erro** nem bloqueio de submissão quando o CNPJ é inválido.

### Alterações em `src/pages/Clientes.tsx`

1. **Estado de erro** — Adicionar `cnpjError` (string) para mensagem de validação
2. **Validação no onChange** — Após aplicar a máscara, se o CNPJ tiver 14 dígitos e for inválido, setar `cnpjError = "CNPJ inválido"`; se válido ou incompleto, limpar o erro
3. **Feedback visual** — Exibir `cnpjError` como texto vermelho abaixo do input, e aplicar borda vermelha ao input quando houver erro
4. **Bloqueio no submit** — Em `handleCriar`, se `documento` tiver 14+ dígitos e `validateCNPJ` retornar false, exibir toast e bloquear o cadastro

### Nenhum outro arquivo precisa ser alterado
`maskDocument`, `validateCNPJ` e `cleanCNPJ` já existem em `src/lib/cnpjUtils.ts`.

