

## Plano: Trocar "Vencimento" por "Data de Lançamento" na aba Despesa

### Alteração

**`src/pages/financeiro/Lancamentos.tsx`** — componente `LancamentoForm`

1. Na linha 86, condicionar o label do campo de data: quando `tipo === "pagar"` exibir **"Data de Lançamento"**, caso contrário manter **"Vencimento"**
2. Nenhuma outra alteração necessária — o campo e o state (`venc`) continuam funcionando igual

### Detalhe técnico

```tsx
// Linha 86 — de:
<Label>Vencimento</Label>
// para:
<Label>{tipo === "pagar" ? "Data de Lançamento" : "Vencimento"}</Label>
```

