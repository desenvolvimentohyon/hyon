

## Plano: Converter sidebar vertical em navegação horizontal

### Resumo
Remover a sidebar lateral esquerda e criar uma barra de navegação horizontal no topo da tela, logo abaixo do Topbar atual, com os módulos dispostos em linha. Ao clicar, navega para a página do módulo — mesmo comportamento atual.

### Arquitetura do layout

```text
┌──────────────────────────────────────────────────┐
│ Topbar (busca, notificações, tema, logout)        │
├──────────────────────────────────────────────────┤
│ ModuleNavBar (ícones + labels dos 7 módulos)      │
├──────────────────────────────────────────────────┤
│                                                  │
│              Conteúdo (Outlet)                   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Mudanças

**1. Novo componente: `src/components/layout/ModuleNavBar.tsx`**
- Barra horizontal full-width com os 7 módulos em linha (`flex` horizontal)
- Cada módulo: ícone circular + label abaixo (mesmo visual dos cards da sidebar)
- Cores semânticas por módulo (reutiliza `MODULE_SIDEBAR_COLORS` do AppSidebar)
- Indicador visual do módulo ativo (borda/background colorido)
- Responsivo: em telas pequenas, scroll horizontal ou ícones menores

**2. Editar: `src/components/layout/AppLayout.tsx`**
- Remover `SidebarProvider` e `AppSidebar`
- Adicionar `ModuleNavBar` entre o Topbar e o conteúdo
- Layout muda de `flex` (horizontal com sidebar) para `flex-col` (vertical puro)

**3. Editar: `src/components/layout/Topbar.tsx`**
- Remover `SidebarTrigger` (não há mais sidebar para controlar)
- Manter todo o resto (breadcrumb, busca, notificações, logout)

**4. Manter intactos**
- `src/lib/sidebarModules.ts` — mesma fonte de dados dos módulos
- `AppSidebar.tsx` — mantém o arquivo (não deletar), apenas não será importado
- Todas as rotas, permissões e funcionalidades existentes

### Visual do ModuleNavBar
- Background com blur (`bg-background/80 backdrop-blur`)
- Módulos distribuídos igualmente (`justify-around` ou `justify-center gap-6`)
- Ícone dentro de círculo colorido (~40px) com label de ~11px abaixo
- Módulo ativo: background e borda coloridos + glow sutil
- Sticky abaixo do Topbar

| Arquivo | Ação |
|---------|------|
| `src/components/layout/ModuleNavBar.tsx` | Criar |
| `src/components/layout/AppLayout.tsx` | Editar (remover sidebar, adicionar nav horizontal) |
| `src/components/layout/Topbar.tsx` | Editar (remover SidebarTrigger) |

