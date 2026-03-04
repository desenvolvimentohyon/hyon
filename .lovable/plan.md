

## Plan: Design System Polish — Fluidity, Consistency & Microinteractions

This plan applies incremental UI/UX refinements across the system without changing any functionality, routes, or data flow. All changes are CSS, component-level styling, and small UX additions.

### Scope Summary

| Area | What Changes |
|------|-------------|
| Design tokens | Standardize spacing scale, transition durations, shadow levels |
| Skeleton loaders | Create reusable `PageSkeleton`, `TableSkeleton`, `KpiSkeleton` components |
| Microinteractions | Normalize transitions to 150–200ms, add hover/focus states |
| Visual hierarchy | KPI cards → section headers → action bars → detail content |
| Table row actions | Add `DropdownMenu` ("…") on list rows (Clientes, Tarefas, Contas) |
| Empty states | Reusable `EmptyState` component with icon + message + CTA |
| Domain colors | Apply semantic palette consistently in badges, chart configs, KPI icons |

---

### 1. Design Tokens — `src/index.css`

- Add CSS custom properties for consistent spacing: `--space-page: 1.5rem` (md: `2rem`)
- Standardize transition: all interactive elements use `transition-all duration-150` or `duration-200`
- Refine shadow tokens: `--shadow-card` for cards at rest, `--shadow-card-hover` for hover lift

### 2. New Shared UI Components (3 files)

**`src/components/ui/page-header.tsx`** — Reusable page header with title, subtitle, and action slot. Replaces ad-hoc `<div className="flex items-center justify-between">` + `<h1>` patterns.

**`src/components/ui/empty-state.tsx`** — Icon + title + description + optional CTA button. Used when lists/tables have zero items.

**`src/components/ui/data-skeleton.tsx`** — Exports `KpiSkeleton`, `TableSkeleton`, `ChartSkeleton` for loading states across pages.

### 3. Row Actions Menu — `src/components/ui/row-actions.tsx`

A small `DropdownMenu` triggered by a "…" (`MoreHorizontal`) icon button. Each page passes an array of actions (`{label, icon, onClick, variant?}`). Applied to:

- **Clientes.tsx** table rows: "Ver detalhes", "Editar", "Nova tarefa"
- **Tarefas.tsx** list view rows: "Abrir", "Alterar status", "Editar prioridade"
- **ContasReceber.tsx** rows: "Baixar", "Copiar cobrança", "Editar"
- **Propostas.tsx** rows: "Ver", "Duplicar", "Enviar"

### 4. Page-by-Page Refinements

**Dashboard.tsx**
- KPI cards: add subtle gradient top-border using domain color (2px colored line at top)
- Increase visual weight of MRR/ARR values (text-2xl → text-3xl for primary metric)
- Alert cards: softer backgrounds, remove emoji, rely on icon + color
- Chart cards: consistent height, subtle card hover

**Clientes.tsx**
- Empty state when `filtered.length === 0` with CTA "Cadastrar primeiro cliente"
- Row hover: `hover:bg-accent/40 transition-colors duration-150`
- Add "…" menu per row

**Tarefas.tsx**
- Kanban cards: card shadow on hover, 150ms transition
- List view: add row action menu
- Empty column state in kanban

**ContasReceber.tsx / ContasPagar.tsx**
- Color-coded status badges using `FINANCEIRO_COLORS`
- Row action menu for quick "Baixar" / "Editar"
- Empty state

**Receita.tsx**
- Ensure all charts use `RECEITA_COLORS` consistently
- KPI cards with colored left border (MRR=blue, Custos=red, Margem=green, Churn=orange)

### 5. Global Transition Standardization

Update `button.tsx` transition from `duration-150` (already good) and ensure all Card components, Badge hover states, TableRow hover states, and Dialog transitions use consistent `duration-150` to `duration-200`.

### 6. Badge Domain Colors

Create helper `domainBadgeClass(domain)` returning tailwind classes:
- `receita/mrr` → blue tints
- `custos` → red tints  
- `lucro/margem` → green tints
- `churn/atraso` → orange tints
- `banco` → purple tints
- `suporte` → cyan tints

Applied in Dashboard, Receita, Financeiro badges.

---

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/ui/page-header.tsx` | Reusable page header |
| `src/components/ui/empty-state.tsx` | Empty state with CTA |
| `src/components/ui/data-skeleton.tsx` | Skeleton loader variants |
| `src/components/ui/row-actions.tsx` | "…" dropdown for table rows |
| `src/lib/domainColors.ts` | Domain color helper functions |

### Files to Edit
| File | Change |
|------|--------|
| `src/index.css` | Add spacing/shadow tokens, refine transitions |
| `src/pages/Dashboard.tsx` | KPI styling, alert cleanup, chart consistency |
| `src/pages/Clientes.tsx` | Empty state, row actions, hover polish |
| `src/pages/Tarefas.tsx` | Card transitions, row actions, empty kanban |
| `src/pages/Receita.tsx` | Colored KPI borders, chart color consistency |
| `src/pages/financeiro/ContasReceber.tsx` | Row actions, status badge colors, empty state |
| `src/pages/financeiro/ContasPagar.tsx` | Same as ContasReceber |
| `src/pages/Propostas.tsx` | Row actions, empty state |
| `src/components/layout/Topbar.tsx` | Minor transition tweaks |

No routes, data flows, or component structure changes. Pure visual/UX polish.

