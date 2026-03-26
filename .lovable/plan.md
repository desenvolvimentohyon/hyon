

## Plano: Alterar label de "Vencimento" para "Data de Lançamento" na Receita Avulsa

### Alteração

**`src/pages/financeiro/Lancamentos.tsx`**

Na linha do campo de data dentro do `LancamentoForm`, o label atual usa a condição `tipo === "pagar" ? "Data de Lançamento" : "Vencimento"`, mostrando "Vencimento" para receitas. Será alterado para exibir "Data de Lançamento" em ambos os casos.

