

## Plano: Mostrar contas bancárias das configurações no módulo financeiro

### Problema
O módulo financeiro usa a tabela `bank_accounts` para listar contas bancárias, enquanto as contas cadastradas nas Configurações (Minha Empresa) ficam na tabela `company_bank_accounts`. São duas fontes de dados desconectadas.

### Solução
Alterar o `FinanceiroContext` para buscar contas da tabela `company_bank_accounts` ao invés de `bank_accounts`, unificando a fonte de dados.

### Alterações

**`src/contexts/FinanceiroContext.tsx`**

1. No `fetchAll`, trocar a query de `bank_accounts` para `company_bank_accounts`
2. Atualizar o mapper `dbToConta` para mapear os campos de `company_bank_accounts` (que tem campos como `bank_name`, `bank_code`, `holder_name`, `pix_key`, `account_type`, `is_default`)
3. Atualizar `addContaBancaria`, `updateContaBancaria`, `deleteContaBancaria` para operar na tabela `company_bank_accounts`

**Mapeamento de campos:**

```text
company_bank_accounts    →   ContaBancaria (tipo interno)
─────────────────────────────────────────────────
bank_name               →   nome (+ banco)
bank_code               →   banco
agency                  →   agencia
account                 →   conta
account_type            →   tipoConta
is_default              →   (novo campo ou lógica)
```

### Impacto
- Todas as telas que usam `contasBancarias` do contexto (Lançamentos, Contas a Receber, Contas a Pagar, Conciliação, Configurações Financeiras, Visão Geral) passarão a mostrar as contas cadastradas em Configurações
- A tabela `bank_accounts` ficará obsoleta (pode ser removida futuramente)

