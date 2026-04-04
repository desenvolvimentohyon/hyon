

## Plano: Edição de Clientes, Propostas, Faturamento e Vínculo ERP no módulo Cartões

### Resumo
Adicionar funcionalidades de edição inline nas três páginas do módulo de cartões (Clientes, Propostas, Faturamento) e mover a opção de vincular ao ERP da página de detalhe para a listagem de clientes.

### 1. Editar Cliente — `CardClientes.tsx`
- Adicionar coluna "Ações" na tabela com botões `Editar` e `Vincular ERP`
- Reutilizar o dialog de criação como dialog de criação/edição:
  - Novo estado `editingClient: CardClient | null`
  - Ao abrir para editar, preencher o form com os dados do cliente
  - Ao salvar, chamar `update.mutateAsync` em vez de `create.mutateAsync`
  - Título do dialog muda: "Editar Cliente" vs "Novo Cliente"
- Botão "Vincular ERP": abre dialog de busca/vinculação (mesmo padrão do `CardClienteDetalhe`) diretamente na listagem
  - Novo estado `linkingClientId`
  - Dialog com busca na tabela `clients` e botão para vincular

### 2. Editar Proposta — `CardPropostas.tsx`
- Adicionar botão `Editar` (ícone `Pencil`) nas ações da tabela (ao lado de Copiar, WhatsApp, etc.)
- Reutilizar dialog de criação como criação/edição:
  - Novo estado `editingProposal: CardProposal | null`
  - Ao abrir para editar, preencher form com dados existentes
  - Ao salvar, chamar `update.mutateAsync({ id, ...fields })`
  - Edição permitida apenas para propostas com status `draft`

### 3. Editar Faturamento — `CardFaturamento.tsx`
- Adicionar coluna "Ações" na tabela de faturamento com botão `Editar` (ícone `Pencil`)
- Reutilizar dialog de lançamento como criação/edição:
  - Novo estado `editingRevenue: any | null`
  - Ao salvar, chamar `createRevenue.mutateAsync` (já faz upsert por `org_id,card_client_id,competency`)
  - Desabilitar campos `Cliente` e `Competência` quando editando (são chave do upsert)

### 4. Vincular ao ERP na listagem — `CardClientes.tsx`
- Mover a lógica de busca ERP + vinculação (já existente em `CardClienteDetalhe`) para a listagem
- Exibir botão "Vincular" na coluna "Vínculo ERP" quando `linked_client_id` for null
- Manter o botão no detalhe também

### Arquivos editados
- `src/pages/cartoes/CardClientes.tsx` — edição de cliente + vínculo ERP na listagem
- `src/pages/cartoes/CardPropostas.tsx` — edição de proposta
- `src/pages/cartoes/CardFaturamento.tsx` — edição de faturamento

### Impacto
3 arquivos editados, ~80 linhas adicionadas. Sem alterações de banco de dados.

