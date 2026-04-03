

## Plano: Pagamento Invisível com Motivo na Geração de Mensalidades

### Objetivo
Permitir que, ao gerar mensalidades, o usuário marque clientes específicos para "pagamento invisível" — o título é criado já com status `pago` e valor zero, com um motivo registrado (ex: cortesia, bonificação, período de testes). Isso mantém o histórico de competência sem gerar cobrança real.

### Alterações

#### 1. Migração — coluna `is_courtesy` na tabela `financial_titles`
- Adicionar `is_courtesy boolean NOT NULL DEFAULT false`
- Adicionar `courtesy_reason text` (nullable)
- Permite filtrar/identificar títulos de cortesia nos relatórios

#### 2. `src/pages/financeiro/GerarMensalidades.tsx`
- Adicionar coluna "Cortesia" na tabela com um toggle (switch) por cliente
- Quando ativado, exibir campo de texto inline para o motivo (obrigatório)
- Clientes marcados como cortesia geram título com:
  - `status: "pago"`, `valorOriginal: 0`, `is_courtesy: true`, `courtesy_reason: motivo`
- Botão "Marcar Selecionados como Cortesia" para ação em lote com modal de motivo

#### 3. `src/contexts/FinanceiroContext.tsx`
- Ajustar `addTitulo` para aceitar campos opcionais `is_courtesy` e `courtesy_reason` no metadata/insert

### Fluxo do Usuário
1. Seleciona competência e clientes normalmente
2. Para clientes que não serão cobrados, ativa o toggle "Cortesia" na linha
3. Preenche o motivo (obrigatório)
4. Ao gerar, esses clientes recebem título com valor R$0,00, status "pago" e motivo registrado
5. Na competência seguinte, o cliente aparece normalmente como "Pendente"

### Detalhes Técnicos
- Migração SQL: `ALTER TABLE financial_titles ADD COLUMN is_courtesy boolean NOT NULL DEFAULT false; ALTER TABLE financial_titles ADD COLUMN courtesy_reason text;`
- O título de cortesia é inserido via `addTitulo` com `valorOriginal: 0`, `status: "pago"` e os novos campos
- Nos relatórios existentes (Contas a Receber), títulos de cortesia aparecem com badge "Cortesia" para diferenciação

