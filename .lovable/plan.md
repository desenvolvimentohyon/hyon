

## Plano: Melhorar Cálculo e Exibição de Parcelas em Contas a Pagar

### Problemas Identificados

1. **Valor por parcela pouco visível** — o texto aparece pequeno e discreto, fácil de ignorar
2. **Não mostra data da última parcela** — o usuário não sabe quando terminará de pagar
3. **Tabela não diferencia parcela de valor total** — quando há múltiplas parcelas, a descrição mostra "(1/10)" mas não fica claro que o valor exibido é da parcela

### Alterações em `src/pages/financeiro/ContasPagar.tsx`

**1. Resumo de parcelas no formulário "Lançar Despesa"**
- Substituir o texto pequeno por um card/resumo destacado com:
  - Valor por parcela em destaque (fonte maior, negrito)
  - Data da primeira e última parcela
  - Exemplo: "10x de R$ 100,00 — de 03/04/2026 até 03/01/2027"
- Mostrar este resumo sempre que parcelas > 1 e valor > 0

**2. Calcular e exibir data da última parcela**
- Com base na data do primeiro vencimento + (numParcelas - 1) meses
- Formatar como dd/mm/yyyy

**3. Tabela: indicar parcelas na coluna Descrição**
- Já mostra "(1/10)" na descrição — manter
- Adicionar badge "Parcelado" quando a descrição contém padrão de parcela

### Impacto
1 arquivo editado. Sem alterações de banco. Melhora a UX do formulário de parcelas.

