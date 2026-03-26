

## Correção: Data de Lançamento duplicada

### Problema
Na linha 86 de `Lancamentos.tsx`, há dois `<Input type="date">` — um dentro de um `<div>` aninhado e outro solto logo depois.

### Correção

**`src/pages/financeiro/Lancamentos.tsx`** — linha 86

De:
```tsx
<div><div><Label>{tipo === "pagar" ? "Data de Lançamento" : "Vencimento"}</Label><Input type="date" value={venc} onChange={e => setVenc(e.target.value)} /></div><Input type="date" value={venc} onChange={e => setVenc(e.target.value)} /></div>
```

Para:
```tsx
<div><Label>{tipo === "pagar" ? "Data de Lançamento" : "Vencimento"}</Label><Input type="date" value={venc} onChange={e => setVenc(e.target.value)} /></div>
```

Remove o `<div>` aninhado extra e o segundo input duplicado.

