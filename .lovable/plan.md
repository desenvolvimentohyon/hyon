

## Correção: Campo de data duplicado no formulário de lançamentos

### Problema
Na linha 93 do `Lancamentos.tsx`, há dois `<Input type="date">` — um dentro de um `<div>` interno e outro solto ao lado, causando a duplicação visível na tela.

### Alteração

**`src/pages/financeiro/Lancamentos.tsx`** — linha 93

Substituir:
```tsx
<div><div><Label>Data de Lançamento</Label><Input type="date" ... /></div><Input type="date" ... /></div>
```

Por:
```tsx
<div><Label>Data de Lançamento</Label><Input type="date" ... /></div>
```

Apenas remover o `<div>` wrapper extra e o segundo `<Input>` duplicado.

