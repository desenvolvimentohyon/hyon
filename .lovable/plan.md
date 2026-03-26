

## Plano: Botão explícito "Nova Conta Mãe"

### Situação atual
O botão "Nova Conta" já existe e cria contas raiz (sem pai). Porém, não fica claro visualmente que ele serve para criar contas mãe.

### Alteração

**`src/pages/financeiro/PlanoDeContas.tsx`**

1. Renomear o botão existente "Nova Conta" para **"Nova Conta Mãe"** com ícone `FolderTree` para deixar claro que cria uma conta raiz
2. O comportamento permanece o mesmo: abre o modal com `paiId: "none"` e tipo `receita`
3. Adicionar sugestão automática do próximo código raiz (ex: se já existem contas `1`, `2`, `3`, sugere `4`)

### Detalhes técnicos
- Calcular próximo código raiz: `(raizes.length + 1).toString()` 
- Pré-preencher `form.codigo` com o valor sugerido ao abrir o modal via esse botão
- Nenhuma alteração de banco de dados

