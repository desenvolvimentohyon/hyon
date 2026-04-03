
## Plano: Gerar Mensalidades em Lote no Financeiro

### Objetivo
Adicionar uma nova sub-página "Gerar Mensalidades" no módulo Financeiro que permite selecionar clientes ativos com mensalidade ativa e gerar títulos de contas a receber em lote.

### Fluxo do Usuário
1. Acessa Financeiro > Gerar Mensalidades
2. Seleciona o mês/ano de competência
3. Sistema lista clientes ativos com `recurrence_active = true`, mostrando: nome, valor mensalidade (`monthly_value_final`), dia de vencimento (`default_due_day`)
4. Usuário seleciona todos ou individualmente via checkboxes
5. Ao confirmar, o sistema cria um título `financial_titles` (tipo "receber", origem "mensalidade") para cada cliente selecionado, com vencimento calculado (dia do cliente + mês/ano selecionado)

### Alterações

#### 1. `src/lib/sidebarModules.ts`
- Adicionar item "Gerar Mensalidades" no array `children` do módulo financeiro, com URL `/financeiro/gerar-mensalidades`

#### 2. `src/App.tsx`
- Adicionar rota `/financeiro/gerar-mensalidades` apontando para o novo componente

#### 3. `src/pages/financeiro/GerarMensalidades.tsx` (novo)
- Busca clientes da tabela `clients` onde `status = 'ativo'` e `recurrence_active = true`
- Campos: seletor de competência (mês/ano), conta bancária padrão
- Tabela com colunas: checkbox, nome do cliente, valor mensalidade, dia vencimento, vencimento calculado
- Checkbox "selecionar todos" no header
- Verifica duplicatas (títulos já existentes para mesma competência + cliente + origem mensalidade) antes de gerar
- Ao confirmar, chama `addTitulo` do `FinanceiroContext` para cada cliente selecionado com:
  - `tipo: "receber"`, `origem: "mensalidade"`, `status: "aberto"`
  - `competenciaMes`: mês/ano selecionado
  - `vencimento`: calculado com o `default_due_day` do cliente
  - `valorOriginal`: `monthly_value_final` do cliente
  - `descricao`: "Mensalidade {mês/ano} - {nome do cliente}"

### Detalhes Técnicos
- Query direta ao Supabase para buscar clientes: `supabase.from("clients").select("id, name, monthly_value_final, default_due_day, status, recurrence_active").eq("status", "ativo").eq("recurrence_active", true)`
- Verificação de duplicatas: query em `financial_titles` filtrando por `origin = 'mensalidade'`, `competency = mês selecionado` e `client_id in (ids selecionados)`
- Clientes com título já gerado para a competência aparecem desabilitados com badge "Já gerado"
- Progress feedback durante geração em lote (toast com contagem)
