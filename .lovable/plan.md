

## Plano: Substituir campo "Nome" por "Nome Fantasia" e "Razão Social" no cadastro de clientes

### Contexto
O formulário de novo cliente em `Clientes.tsx` usa um campo "Nome" que mapeia para `clients.name`. A tabela já possui `trade_name` (Nome Fantasia) e `legal_name` (Razão Social) que não são usados no cadastro. O usuário quer remover "Nome" e usar apenas esses dois campos.

### Alterações

**1. `src/types/index.ts`** — Adicionar campos ao tipo `Cliente`
- Adicionar `nomeFantasia?: string` e `razaoSocial?: string` à interface `Cliente`

**2. `src/contexts/AppContext.tsx`** — Atualizar mappers
- `dbToCliente`: mapear `trade_name` → `nomeFantasia`, `legal_name` → `razaoSocial`; usar `trade_name || legal_name || name` como fallback para `nome` (manter retrocompatibilidade com listagens)
- `clienteToDb`: incluir `trade_name` e `legal_name` no insert/update
- `updateCliente`: tratar `nomeFantasia` e `razaoSocial` nos updates

**3. `src/pages/Clientes.tsx`** — Alterar formulário de cadastro
- Remover campo "Nome" e estado `nome`
- Adicionar estados `nomeFantasia` e `razaoSocial`
- Substituir o campo por dois campos lado a lado: "Nome Fantasia *" e "Razão Social"
- No `handleCriar`, usar `nomeFantasia` como `nome` (campo obrigatório) e passar `nomeFantasia` e `razaoSocial`
- Atualizar `applyCnpjData` para preencher `nomeFantasia` (fantasia) e `razaoSocial` (nome da receita)

**4. Listagem/busca** — Atualizar filtro
- Busca passará a considerar `nomeFantasia` e `razaoSocial` além de `nome`

### Sem migração necessária
Os campos `trade_name` e `legal_name` já existem na tabela `clients`.

