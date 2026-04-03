

## Plano: Cancelar todos os lançamentos futuros de uma despesa recorrente

### Como funciona
Quando o usuário clicar em uma despesa recorrente, verá uma nova opção no menu de ações: **"Cancelar futuros"**. Ao confirmar, todos os lançamentos com status "aberto" e vencimento posterior ao título selecionado (da mesma série recorrente) serão excluídos.

### Alterações em `src/pages/financeiro/ContasPagar.tsx`

**1. Novo estado para o modal de confirmação**
- `cancelarFuturosId` para armazenar o título selecionado

**2. Lógica de cancelamento em lote**
- Extrair a base da descrição (removendo o sufixo `(recorrente X/Y)`)
- Buscar todos os títulos da lista completa (`titulos`) que:
  - Têm a mesma base de descrição
  - Contêm `(recorrente` na descrição
  - Possuem `status === "aberto"`
  - Têm `vencimento > vencimento do título selecionado`
- Chamar `deleteTitulo` para cada um deles

**3. Nova ação no menu `RowActions`**
- Exibir opção "Cancelar futuros" (com ícone `XCircle`) apenas quando a descrição contiver `(recorrente`
- Ao clicar, abrir AlertDialog de confirmação mostrando quantos lançamentos serão excluídos

**4. Novo AlertDialog de confirmação**
- Título: "Cancelar lançamentos futuros"
- Descrição informando a quantidade de lançamentos que serão removidos
- Botões: Cancelar / Confirmar Exclusão

### Impacto
1 arquivo, ~30 linhas adicionadas. Nenhuma alteração de banco de dados necessária.

