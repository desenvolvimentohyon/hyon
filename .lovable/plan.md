

## Plan: Reorganize Config Tabs + Fix CNPJ Lookup

### File 1: `src/pages/Configuracoes.tsx`

**Tab order change**: Swap the tab order so "Minha Empresa" appears first, and set `defaultValue="empresa"` instead of `"geral"`.

- Move the "Minha Empresa" `TabsTrigger` before "Configurações Gerais"
- Change `defaultValue` from `"geral"` to `"empresa"`
- Remove the `isAdmin` guard on the "Minha Empresa" tab trigger and content (or keep it but make it first when visible)

### File 2: `src/components/configuracoes/MinhaEmpresa.tsx`

**Fix CNPJ lookup field mapping** -- the edge function returns fields named `nome`, `fantasia`, `logradouro`, etc. but the component incorrectly maps them as `data.razao_social`, `data.nome_fantasia`, `data.cnae_fiscal`.

Corrected mapping (lines 207-220):
- `data.nome` (not `data.razao_social`) -> `legal_name`
- `data.fantasia` (not `data.nome_fantasia`) -> `trade_name`
- `data.telefone` -> `phone`
- `data.email` -> `email`
- `data.cep` -> `address_cep`
- `data.logradouro` -> `address_street`
- `data.numero` -> `address_number`
- `data.complemento` -> `address_complement`
- `data.bairro` -> `address_neighborhood`
- `data.municipio` -> `address_city`
- `data.uf` -> `address_uf`
- Remove `cnae_fiscal` mapping (not returned by API)

**Add CNPJ validation before lookup**: Import `validateCNPJ` and `maskDocument` from `@/lib/cnpjUtils`, validate before calling the edge function, and show appropriate error toast if invalid.

**Add CNPJ mask**: Apply `maskDocument` on the CNPJ input's `onChange` handler so it auto-formats as the user types.

**Improve error messages**: Show specific toast messages for invalid CNPJ vs API failure.

