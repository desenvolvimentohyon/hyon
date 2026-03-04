

## Plan: Dark Premium Redesign — Neon Glow + Executive Dashboard

The system already has a dark theme, Inter font, design tokens, KPI cards, charts, sidebar with icons, and transitions. This plan deepens the dark aesthetic with a "petróleo/grafite" palette, adds subtle neon glow effects, and polishes charts and tables to match premium BI dashboards.

---

### 1. Deepen Dark Theme Tokens — `src/index.css`

Update `.dark` CSS variables for a richer, more immersive dark palette:

- `--background`: shift to a blue-petrol dark (`222 47% 5%`)
- `--card`: darker graphite with slight blue tint (`222 35% 8%`)
- `--border`: subtler (`222 15% 12%`)
- `--muted`: deeper (`222 20% 10%`)
- Add new utility classes:
  - `.neon-border`: `box-shadow: 0 0 8px hsl(var(--primary) / 0.15); border-color: hsl(var(--primary) / 0.3)`
  - `.neon-glow-input`: subtle glow on input focus
  - `.gradient-bg`: background gradient (top-left lighter → bottom-right darker)
  - Update `.glass-surface` with lower opacity borders

### 2. Global Gradient Background — `src/components/layout/AppLayout.tsx`

Add a subtle radial gradient to the `<main>` wrapper: `bg-gradient-to-br from-background via-background to-background/95` with a faint radial overlay via CSS.

### 3. Chart Styling Refinement — `src/pages/Dashboard.tsx` + `src/pages/financeiro/FinanceiroVisaoGeral.tsx`

- Set `CartesianGrid` to very low opacity (`stroke-opacity: 0.08`)
- Remove white backgrounds from chart containers
- Add `filter: drop-shadow(0 0 4px ...)` on line strokes for neon glow effect
- Donut charts: add center label with total value
- Ensure all chart tooltips use dark background with rounded corners

### 4. KPI Cards Neon Polish — `src/pages/Dashboard.tsx`

- Add subtle left-border glow on KPI cards matching domain color
- Increase value font to `text-3xl font-extrabold` for executive feel
- Add subtle sparkline placeholder area (visual only)
- Cards get `.neon-border` on hover

### 5. Table Premium Styling — `src/components/ui/table.tsx`

- `TableHead`: sticky header with `bg-muted/30 backdrop-blur-sm`, uppercase text-[11px]
- `TableRow`: subtle zebra via `even:bg-muted/20`, softer hover `hover:bg-primary/5`
- Tighter borders with lower opacity

### 6. Badge Glow Variants — `src/components/ui/badge.tsx`

No structural changes, but add a `glow` variant option for status badges that adds a subtle box-shadow matching the badge color.

### 7. Button Neon Primary — `src/components/ui/button.tsx`

- Primary variant: add `shadow-[0_0_12px_hsl(var(--primary)/0.25)]` on hover
- Smooth transition on shadow

### 8. Input Neon Focus — `src/components/ui/input.tsx`

- Replace current focus ring with a neon glow: `focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]`
- Slightly darker input background in dark mode

### 9. Sidebar Enhancement — `src/components/layout/AppSidebar.tsx`

- Active item: add left glow bar (`box-shadow: -2px 0 8px hsl(var(--primary)/0.3)`)
- Deeper sidebar background
- Group labels with slightly more visible dividers

### 10. Topbar Refinement — `src/components/layout/Topbar.tsx`

- Add subtle bottom gradient border instead of solid line
- Search input: darker bg with neon focus

### 11. Financeiro Page Polish — `src/pages/financeiro/FinanceiroVisaoGeral.tsx`

- Use `PageHeader` component (currently uses raw h1)
- KPI cards: apply same neon-border pattern as Dashboard
- Chart gridlines: low opacity

### Files to Edit
| File | Change |
|------|--------|
| `src/index.css` | Deeper dark tokens, neon utility classes, gradient-bg |
| `src/components/layout/AppLayout.tsx` | Gradient background on main |
| `src/components/ui/table.tsx` | Sticky header, zebra, softer hover |
| `src/components/ui/button.tsx` | Neon shadow on primary hover |
| `src/components/ui/input.tsx` | Neon focus glow |
| `src/components/ui/card.tsx` | Neon-border hover effect |
| `src/components/layout/AppSidebar.tsx` | Active glow bar, deeper bg |
| `src/components/layout/Topbar.tsx` | Gradient border, darker search |
| `src/pages/Dashboard.tsx` | Chart glow, KPI typography bump, grid opacity |
| `src/pages/financeiro/FinanceiroVisaoGeral.tsx` | PageHeader, chart polish, KPI neon |

No logic changes. No route changes. No new dependencies.

