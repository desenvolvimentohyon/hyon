

## Plano: Adicionar Alteração em Lote na tela de Clientes e Receita

### Problema
A tela `/clientes` (ClientesReceita.tsx) não possui funcionalidade de seleção múltipla nem edição em lote. O `ClienteCard` já suporta props `selected` e `checkbox`, mas não são utilizados.

### Funcionalidade
Adicionar um botão "Alteração em Lote" que ativa modo de seleção múltipla nos cards. Ao selecionar clientes, aparece uma barra de ações com botão para abrir um diálogo de edição em lote.

### Campos editáveis em lote
- **Dia de Vencimento** (`default_due_day`) — opções: 3, 5, 7
- **Índice de Reajuste** (`adjustment_type`) — ex: IGPM, IPCA, manual
- **Regime Tributário** (`tax_regime`) — Simples Nacional, Lucro Presumido, Lucro Real, MEI
- **Plano de Cobrança** (`metadata.billing_plan`) — mensal, trimestral, semestral, anual

Cada campo só é atualizado se o usuário explicitamente alterar o valor (campos começam vazios/placeholder "Manter atual").

### Alterações

#### 1. `src/pages/ClientesReceita.tsx`
- Adicionar estados: `batchMode` (boolean), `selectedIds` (Set), `showBatchEdit` (boolean)
- Adicionar botão "Alteração em Lote" no header ao lado de Exportar
- Quando `batchMode = true`:
  - Mostrar checkbox em cada `ClienteCard` usando a prop `checkbox`
  - Mostrar barra fixa no topo com contagem + botão "Editar Selecionados" + "Cancelar"
  - Botão "Selecionar Todos" / "Desmarcar Todos"
- Diálogo de edição em lote com os 4 campos acima
- Função `handleBatchUpdate` que faz `supabase.from("clients").update({...}).in("id", [...selectedIds])`
  - Para `billing_plan`: busca metadata atual de cada cliente, faz merge individual

#### 2. `src/contexts/ReceitaContext.tsx`
- Nenhuma alteração necessária — o batch update vai direto no Supabase e depois chama refresh dos dados

### Fluxo do usuário
1. Clica "Alteração em Lote" → cards mostram checkboxes
2. Seleciona clientes desejados (ou "Selecionar Todos")
3. Clica "Editar Selecionados" → abre diálogo
4. Preenche apenas os campos que quer alterar
5. Clica "Aplicar" → atualiza no banco → refresh da lista → toast de confirmação

### Impacto
1 arquivo editado (~120 linhas adicionadas). Usa componentes existentes (Checkbox, Dialog, Select).

