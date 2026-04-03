

## Plano: Redesign visual estilo DashCortex

### Escopo
Aplicar a estética visual do DashCortex ao ITControl ONE, mantendo todas as funcionalidades e rotas existentes. As mudanças são puramente visuais (CSS, componentes de layout, tema).

### Elementos visuais do DashCortex a replicar
- Fundo navy ultra-escuro com gradientes sutis
- Sidebar com ícones circulares (sem texto), estilo "dock" vertical
- Cards com glassmorphism mais pronunciado (bordas translúcidas, blur forte)
- KPI cards com bordas neon coloridas e sparklines
- Tipografia mais contrastante (brancos puros em destaque)
- Glow effects azul/cyan nos elementos interativos

### Alterações

#### 1. `src/index.css` — Tema dark refinado
- Escurecer `--background` e `--card` para navy mais profundo (#030712 / #0a1628)
- Aumentar contraste de `--foreground` 
- Intensificar sombras com glow azulado
- Refinar variáveis de glassmorphism (`--shadow-card`, `--shadow-elevated`)

#### 2. `src/components/layout/AppSidebar.tsx` — Sidebar estilo dock
- Transformar sidebar em dock vertical com ícones circulares (sem labels de texto)
- Fundo translúcido com blur
- Ícone ativo com glow circular colorido
- Tooltip no hover mostrando nome do módulo
- Logo compacta no topo

#### 3. `src/components/layout/AppLayout.tsx` — Ajuste de layout
- Adaptar espaçamento para sidebar dock (largura reduzida ~64px)
- Manter estrutura de main content

#### 4. `tailwind.config.ts` — Utilitários adicionais
- Adicionar classes para glow effects e glassmorphism avançado
- Novas keyframes para animações de pulse/glow

#### 5. Componentes de KPI/Cards existentes — Refinamento visual
- Aplicar bordas neon por domínio nos cards de dashboard
- Glassmorphism mais forte nos cards (`backdrop-blur-xl`, bordas translúcidas)

### Importante
- Nenhuma funcionalidade ou rota será alterada
- A sidebar mantém todos os módulos e permissões existentes, apenas muda a forma visual
- O modo expanded (com textos) será substituído pelo modo dock (apenas ícones + tooltips)

### Estimativa
~5 arquivos alterados, mudança visual significativa mas sem impacto funcional.

