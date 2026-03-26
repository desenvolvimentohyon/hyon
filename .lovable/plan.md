

## Plano: Adicionar botão "Nova Subconta" em cada conta mãe

### O que muda
Adicionar um botão "+" em cada nó da árvore de contas que, ao ser clicado, abre o modal de criação já com a **conta pai pré-selecionada** e o **tipo herdado** da conta mãe. Também permitir que qualquer conta (não apenas raízes) seja selecionada como pai no modal.

### Alterações

**`src/pages/financeiro/PlanoDeContas.tsx`**

1. **TreeNode** — receber uma nova prop `onAddChild` e exibir um botão `+` ao lado dos botões de editar/excluir (visível no hover):
   - Ao clicar, chama `onAddChild(item)` passando a conta mãe
   - Ícone `Plus` com tamanho pequeno (`h-3 w-3`)

2. **PlanoDeContas (componente pai)** — criar função `handleAddChild(parent)`:
   - Define `editing = null`
   - Pré-preenche `form.paiId` com o ID da conta mãe
   - Pré-preenche `form.tipo` com o tipo da conta mãe
   - Sugere o próximo código (ex: se pai é `1` e já tem filhos `1.01`, `1.02`, sugere `1.03`)
   - Abre o modal

3. **Select de "Conta pai" no modal** — listar **todas** as contas (não apenas raízes), para permitir hierarquia multinível. Exibir com indentação visual pelo código.

### Detalhes técnicos
- A sugestão automática de código conta quantos filhos o pai já tem via `getFilhosPlanoContas(parentId)` e incrementa
- Formato do código sugerido: `{codigoPai}.{(filhos.length + 1).toString().padStart(2, '0')}`
- Nenhuma alteração de banco de dados necessária

