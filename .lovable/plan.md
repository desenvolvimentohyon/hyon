

# Plano: Pagamentos de Cliente + Comprovantes + Alertas de Vencimento

## 1. Banco de Dados

### 1.1 Migração: Adicionar campos de vigência na tabela `clients`
```sql
ALTER TABLE clients ADD COLUMN billing_plan text DEFAULT 'mensal';
ALTER TABLE clients ADD COLUMN plan_start_date date;
ALTER TABLE clients ADD COLUMN plan_end_date date;
```

### 1.2 Criar tabela `payment_receipts`
Campos: id, org_id, client_id (FK clients), payment_id (uuid nullable, referência a financial_titles), payment_type (text: parcela/plano), plan_type (text nullable: mensal/trimestral/semestral/anual), period_start (date), period_end (date), competency (text), amount (numeric), paid_at (date), method (text), notes (text), file_path (text), file_name (text), file_size (int), mime_type (text), created_at.

RLS: org_id = current_org_id(). INSERT/UPDATE/DELETE para admin e financeiro. SELECT para todos da org.

### 1.3 Criar bucket de storage `payment-receipts`
Bucket privado com RLS policies para upload/download por org.

## 2. Frontend

### 2.1 Nova aba "Pagamentos" no ClienteDetalhe
- Adicionar entrada `{ value: "pagamentos", label: "Pagamentos", icon: Wallet }` no array TABS
- Criar `src/components/clientes/tabs/TabPagamentos.tsx`:
  - Tabela listando payment_receipts do cliente (data, período, tipo, valor, método, status, ícone comprovante)
  - Botão "Registrar Pagamento" abre Dialog com: tipo (parcela/plano), plano selecionado, competência ou período, valor, data, método, observações, upload de arquivo
  - Ao salvar pagamento tipo "plano": atualizar `billing_plan`, `plan_start_date`, `plan_end_date` no cliente automaticamente
  - Download/visualização do comprovante via storage URL

### 2.2 Hook `usePaymentReceipts(clienteId)`
- CRUD com supabase para payment_receipts
- Upload/download de arquivo via supabase.storage

### 2.3 Campos de vigência na aba Mensalidade
- Adicionar campos `billing_plan`, `plan_start_date`, `plan_end_date` (read-only, calculado) na TabMensalidadeNew
- Cálculo automático de plan_end_date ao alterar plano ou start_date

### 2.4 Banner de alerta no ClienteDetalhe
- Se `plan_end_date` existe e falta <= 7 dias: exibir banner amarelo no topo "Plano vence em X dias"

### 2.5 Widget no Dashboard
- Query clientes ativos com `plan_end_date` entre hoje e hoje+7 dias
- Card "Planos Vencendo (7 dias)" com lista top 10: nome, plano, data vencimento, dias restantes, link para abrir cliente

## 3. Tipos
- Atualizar `ClienteFull` em useClienteDetalhe.ts com os 3 novos campos

## 4. Arquivos

**Criar:**
- `src/components/clientes/tabs/TabPagamentos.tsx`
- `src/hooks/usePaymentReceipts.ts`

**Editar:**
- `src/hooks/useClienteDetalhe.ts` — adicionar campos ao tipo
- `src/components/clientes/ClienteDetalhe.tsx` — adicionar aba + banner de alerta
- `src/components/clientes/tabs/TabMensalidadeNew.tsx` — campos de vigência
- `src/pages/Dashboard.tsx` — widget de planos vencendo

## 5. Ordem de Execução
1. Migração DB (campos clients + tabela payment_receipts + bucket storage)
2. Hook usePaymentReceipts
3. TabPagamentos (lista + modal + upload)
4. Integrar aba no ClienteDetalhe + banner de alerta
5. Campos de vigência na TabMensalidadeNew
6. Widget no Dashboard

