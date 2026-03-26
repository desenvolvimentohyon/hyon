

## Plano: Adicionar Forma de Pagamento, Valor Parcial e Cadastro de Cliente no Lançamentos

### Alterações em `src/pages/financeiro/Lancamentos.tsx`

#### 1. Forma de Pagamento
- Importar `useParametros` do `ParametrosContext` para acessar `formasPagamento`
- Adicionar state `formaPagamento` no `LancamentoForm`
- Adicionar campo Select com as formas de pagamento cadastradas em Parâmetros
- Passar o `payment_method_id` selecionado no `addTitulo` (campo `payment_method_id` já existe na tabela `financial_titles`)
- Atualizar o metadata para incluir o nome da forma ao invés do enum hardcoded `"pix"`

#### 2. Valor Parcial (Desconto, Juros, Multa)
- Adicionar states para `desconto`, `juros` e `multa`
- Adicionar 3 campos `CurrencyInput` no grid do formulário
- Exibir o **valor final calculado** (Valor - Desconto + Juros + Multa) abaixo dos campos
- Passar esses valores no `addTitulo` (já suportado pelo contexto)

#### 3. Cadastro Simplificado de Cliente (inline)
- Seguir o padrão existente em `Tarefas.tsx`: ao selecionar "Cadastrar novo cliente" no Select, exibir formulário inline com Nome, Telefone, Email e Cidade
- No `handleSave`, se `clienteId === "novo"`, criar o cliente via `supabase.from("clients").insert(...)` e usar o ID retornado para vincular ao título
- Essa funcionalidade se aplica apenas na aba de Receita (tipo "receber")

### Detalhes Técnicos

**Arquivo**: `src/pages/financeiro/Lancamentos.tsx`

- Novos imports: `useParametros` de `@/contexts/ParametrosContext`, `supabase` de `@/integrations/supabase/client`, `useAuth` de `@/contexts/AuthContext`
- Props do `LancamentoForm`: adicionar `formasPagamento` (lista de `FormaPagamentoCatalogo`)
- No componente pai `Lancamentos`, puxar `formasPagamento` do `useParametros()` e passar como prop
- No `handleSave`:
  - Se `clienteId === "novo"`, inserir cliente com `name`, `trade_name`, `phone`, `email`, `city`, `org_id` e usar o `id` retornado
  - Enviar `formaPagamento` selecionada via metadata e `payment_method_id`
  - Enviar `desconto`, `juros`, `multa` nos campos correspondentes

