

## Plano: Refinamento Visual SaaS Premium

### Análise do Estado Atual

O sistema **já possui** a maioria das características solicitadas:
- Fonte Inter, sidebar agrupada com ícones/hover/active states, dashboard com KPIs + sparklines + tooltips, design tokens, domain colors, empty states, glassmorphism, animações, etc.

O que precisa de **refinamento** são ajustes pontuais de polimento visual para elevar o nível de acabamento, sem reescrever o que já funciona bem.

### Alterações Planejadas

**1. CSS Global (`src/index.css`)**
- Refinar variáveis de shadow para sombras mais sutis e modernas (estilo Linear/Stripe)
- Melhorar transições globais com `transition-colors` em links e botões
- Adicionar utility classes: `.section-header` (padronização de títulos de seção), `.stat-value` (números grandes de KPI)
- Ajustar `--border` para ser mais sutil no modo claro

**2. Componentes UI base**
- `card.tsx`: Remover hover genérico do Card (nem todo card precisa de hover lift) — mover hover animado para uma variante `interactive`
- `button.tsx`: Refinar glow do botão primary para ser mais sutil
- `input.tsx` + `textarea.tsx` + `select.tsx`: Padronizar focus ring para `ring-2 ring-primary/15` em vez de box-shadow customizado
- `table.tsx`: Refinar header com `text-[11px]` → `text-xs`, melhorar contraste do header background
- `page-header.tsx`: Adicionar uma borda inferior sutil como separador visual

**3. Topbar (`Topbar.tsx`)**
- Reduzir a poluição visual: simplificar o seletor de usuário, remover o `kbd` do search
- Melhorar a separação visual entre áreas (search | actions | user)
- Avatar mais proeminente com ring de status

**4. Sidebar (`AppSidebar.tsx`)**
- Refinar o active state: usar `bg-sidebar-primary/12` com borda lateral mais fina e limpa
- Melhorar o espaçamento entre grupos de módulos
- Adicionar label de versão/ambiente (dev/prod) no footer

**5. Dashboard (`Dashboard.tsx`)**
- Padronizar os KPI cards para não cortar texto (responsive grid ajustado)
- Melhorar o PageHeader com saudação mais discreta
- Refinar os chart cards com padding/spacing mais consistente

**6. Formulários e Modais**
- Padronizar `DialogContent` com bordas mais suaves e shadow elevado
- Melhorar spacing interno dos forms (gap-4 → gap-5 nos form groups)

**7. Design Tokens refinados (`tailwind.config.ts`)**
- Adicionar `transition` utilities padronizadas
- Ajustar `borderRadius` para valores mais modernos (0.625rem base)

### Arquivos a editar

| Arquivo | Tipo de alteração |
|---------|-------------------|
| `src/index.css` | Refinar variáveis CSS e utilities |
| `tailwind.config.ts` | Ajustar tokens |
| `src/components/ui/card.tsx` | Variante interativa |
| `src/components/ui/button.tsx` | Sutil refinamento do glow |
| `src/components/ui/input.tsx` | Focus ring padronizado |
| `src/components/ui/table.tsx` | Header refinado |
| `src/components/ui/dialog.tsx` | Shadow e bordas |
| `src/components/ui/page-header.tsx` | Separador visual |
| `src/components/layout/Topbar.tsx` | Simplificação visual |
| `src/components/layout/AppSidebar.tsx` | Polimento do active/spacing |
| `src/pages/Dashboard.tsx` | Grid KPI responsivo |

### O que NÃO será alterado
- Nenhuma lógica de negócio
- Nenhuma rota
- Nenhum banco de dados
- Nenhum contexto/hook

