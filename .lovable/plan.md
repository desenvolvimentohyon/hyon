

## Plano: Corrigir FK de bank_account_id na tabela financial_titles

### Problema
A coluna `bank_account_id` em `financial_titles` tem uma foreign key apontando para a tabela `bank_accounts`. Após migrarmos o contexto financeiro para usar `company_bank_accounts`, os IDs inseridos não existem em `bank_accounts`, causando o erro de constraint.

### Solução
Uma migração SQL para:
1. Remover a FK antiga (`financial_titles_bank_account_id_fkey` → `bank_accounts`)
2. Criar nova FK apontando para `company_bank_accounts`

### Migração SQL
```sql
ALTER TABLE public.financial_titles
  DROP CONSTRAINT financial_titles_bank_account_id_fkey;

ALTER TABLE public.financial_titles
  ADD CONSTRAINT financial_titles_bank_account_id_fkey
  FOREIGN KEY (bank_account_id) REFERENCES public.company_bank_accounts(id)
  ON DELETE SET NULL;
```

### Impacto
- Nenhuma alteração de código necessária
- Lançamentos existentes que referenciam IDs da tabela `bank_accounts` antiga terão o `bank_account_id` mantido (se os IDs ainda existirem) ou precisarão ser limpos
- Novos lançamentos passarão a funcionar corretamente com as contas das configurações

