

## Plano: Mover menu de módulos para sidebar lateral esquerda compacta

### Objetivo
Converter a barra horizontal de módulos (`ModuleNavBar`) em uma sidebar vertical fixa à esquerda, compacta (estilo mini-sidebar com apenas ícones), mantendo as cores semânticas, tooltips e comportamento de ativo.

### Alterações

**1. `src/components/layout/ModuleNavBar.tsx`** — Converter de barra horizontal para sidebar vertical:
- Mudar o layout de `flex items-center justify-center` horizontal para `flex flex-col` vertical
- Fixar à esquerda com largura compacta (~60px), ocupando a altura total abaixo do Topbar
- Reduzir os ícones de `h-10 w-10` para `h-8 w-8` e o texto de `text-[11px]` para `text-[9px]`
- Tooltip para o lado `right` ao invés de `bottom`
- Remover `sticky top-16` e usar `fixed left-0 top-16 bottom-0` ou integrar no flex layout
- Manter as cores semânticas, glow e transições já existentes

**2. `src/components/layout/AppLayout.tsx`** — Ajustar layout para sidebar lateral:
- Mudar o layout de `flex flex-col` para `flex` (horizontal) abaixo do Topbar
- Adicionar `ModuleNavBar` como sidebar à esquerda
- O conteúdo principal (`main`) recebe `flex-1` ao lado da sidebar
- Adicionar `ml` ou padding para compensar a largura da sidebar

### Detalhes técnicos

```text
AppLayout (novo layout):
  <div className="min-h-screen flex flex-col w-full">
    <Topbar />                          ← full width, topo
    <div className="flex flex-1">       ← container horizontal
      <ModuleNavBar />                  ← sidebar vertical, ~60px
      <main className="flex-1 ...">     ← conteúdo principal
    </div>
  </div>

ModuleNavBar (conversão):
  - nav: flex-col, w-[60px], h-full, border-right
  - ícones: h-8 w-8, rounded-lg (ao invés de rounded-full)
  - labels: text-[9px], max-w-[52px]
  - min-w por botão: ~52px
  - tooltips: side="right"
  - overflow-y-auto para scroll vertical se necessário
```

Nenhuma mudança em rotas, lógica de navegação ou cores. Apenas reorganização visual.

