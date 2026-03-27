

## Plano: Valor total do plano anual com cálculo automático da mensalidade

### Objetivo
Quando o plano "Anual" (ou trimestral/semestral) for selecionado, exibir um campo para informar o **valor total do plano**. O sistema divide automaticamente pelo número de meses (12, 6 ou 3) e preenche o "Valor Final" mensal.

Exemplo: Plano anual = R$ 1.200,00 → Valor Final mensal = R$ 100,00.

### Alterações — 1 arquivo

**`src/components/clientes/tabs/TabMensalidadeNew.tsx`**

1. Adicionar um campo `CurrencyInput` "Valor Total do Plano" que aparece **condicionalmente** quando o plano NÃO é "mensal"
2. Armazenar o valor total no metadata do cliente (`metadata.plan_total_value`)
3. Ao alterar o valor total, calcular `monthly_value_final = valorTotal / meses` (onde meses = 3, 6 ou 12 conforme o plano)
4. Ao trocar o plano, recalcular automaticamente se já houver valor total preenchido
5. No resumo inferior, exibir também o valor total do plano quando aplicável

### Lógica

```text
Planos não-mensais mostram campo extra:
  [Valor Total do Plano (R$)]  →  R$ 1.200,00
  [Valor Final Mensal (R$)]    →  R$ 100,00 (calculado = 1200/12, readOnly)

Plano mensal:
  Campo "Valor Total" fica oculto
  "Valor Final" continua editável normalmente

Divisores:
  trimestral → /3
  semestral  → /6
  anual      → /12
```

### Detalhes técnicos
- O valor total é salvo em `metadata.plan_total_value` (jsonb, sem migração necessária)
- Quando plano não é mensal: "Valor Final" fica `readOnly` (calculado) e "Valor Total do Plano" é editável
- Quando plano é mensal: "Valor Total" some e "Valor Final" volta a ser editável
- O resumo inferior mostra "Valor total do plano: R$ X" quando aplicável

