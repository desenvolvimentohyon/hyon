

## Plano: Fixar menu lateral ao rolar a página

### Problema
O container externo usa `min-h-screen`, permitindo que a página inteira cresça além da viewport. Isso faz o scroll acontecer no nível do documento (body), arrastando o menu lateral junto.

### Solução
Mudar o container externo de `min-h-screen` para `h-screen` e garantir que o overflow seja contido apenas no `<main>`.

### Alteração — 1 arquivo

**`src/components/layout/AppLayout.tsx`** (linha 40):
- Trocar `min-h-screen` por `h-screen overflow-hidden` no div raiz
- Isso força a altura máxima do viewport, impedindo scroll no nível do documento
- Apenas o `<main>` (que já tem `overflow-auto`) terá scroll

```text
Antes:  <div className="min-h-screen flex flex-col w-full">
Depois: <div className="h-screen flex flex-col w-full overflow-hidden">
```

