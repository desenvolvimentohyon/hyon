

## Plano: Fixar menu lateral esquerdo ao rolar a página

### Problema
O menu lateral (`ModuleNavBar`) rola junto com o conteúdo da página. Ele precisa ficar fixo (sticky) enquanto apenas o conteúdo principal rola.

### Solução

O layout já usa `flex` com `overflow-hidden` no container e `overflow-auto` no `main`. O problema é que o `nav` dentro do `ModuleNavBar` não tem altura fixa — ele precisa de `sticky top-0` e altura definida para não rolar junto.

**`src/components/layout/ModuleNavBar.tsx`** — Adicionar `sticky top-0 h-full` ao `<nav>`:
- Trocar a classe do `<nav>` para incluir `sticky top-0 h-[calc(100vh-4rem)]` (descontando a altura do Topbar) para que fique fixo verticalmente dentro do flex container

Na verdade, como o container pai já tem `overflow-hidden` e o `main` é quem tem `overflow-auto`, o sidebar já deveria estar fixo. O mais provável é que o `overflow-hidden` não esteja funcionando corretamente ou o container flex não tenha `h-full`.

**Correção real — 1 arquivo:**

**`src/components/layout/AppLayout.tsx`** — Garantir que o container flex tenha altura fixa:
- No div `flex flex-1 overflow-hidden`, adicionar `h-0` para forçar que o flex-1 respeite o overflow (hack CSS comum) — ou usar `min-h-0`

**`src/components/layout/ModuleNavBar.tsx`** — Garantir que o nav não cresça além do viewport:
- Adicionar `h-full` ao nav para que ele ocupe exatamente a altura do container pai sem expandir

### Detalhes técnicos
```text
AppLayout.tsx linha 43:
  "flex flex-1 overflow-hidden"  →  "flex flex-1 overflow-hidden min-h-0"

ModuleNavBar.tsx linha 32 (nav):
  adicionar "h-full" às classes existentes
```

