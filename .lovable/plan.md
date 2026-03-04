

## Plan: Acronym Tooltips + Dashboard Typography Polish

The system already has a comprehensive SaaS premium design system in place (dark theme, tokens, card shadows, transitions, sidebar with active indicators, PWA, empty states, glass effects). This plan addresses the two remaining gaps: **acronym tooltips** and **KPI typography refinement**.

### 1. Add Acronym Tooltips to Dashboard KPIs — `src/pages/Dashboard.tsx`

Wrap financial acronym labels (MRR, ARR, Churn, Ticket Medio, Margem) with `<Tooltip>` from `@/components/ui/tooltip`, showing a rich explanation on hover.

Tooltip content map:
- **MRR** → "Monthly Recurring Revenue — Receita recorrente mensal proveniente das mensalidades dos clientes ativos."
- **ARR** → "Annual Recurring Revenue — Projeção anual da receita recorrente baseada no MRR atual."
- **Ticket Médio** → "Valor médio pago por cliente ativo."
- **Churn** → "Churn Rate — Taxa de cancelamento de clientes em determinado período."
- **Margem** → "Margem Líquida — Valor restante após deduzir custos da receita recorrente."

Each label gets a dashed underline hint (`border-b border-dashed cursor-help`) to signal interactivity.

### 2. Add Acronym Tooltips to Executive Widgets — `src/components/DashboardExecutiveWidgets.tsx`

Same tooltip pattern for "MRR Atual", "Crescimento MRR", "LTV" if present.

### 3. Increase KPI Value Font Size — `src/pages/Dashboard.tsx`

Change Receita KPI values from `text-2xl` to `text-3xl` for stronger visual hierarchy on the financial row.

### 4. Refine PageHeader Typography — `src/components/ui/page-header.tsx`

Update title from `text-2xl` to `text-[28px] lg:text-[32px]` for the premium SaaS feel requested.

### Files to Edit
| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Add Tooltip wrappers on acronym labels, bump KPI font size |
| `src/components/DashboardExecutiveWidgets.tsx` | Add Tooltip wrappers on MRR labels |
| `src/components/ui/page-header.tsx` | Larger title typography |

No logic changes. No route changes. No new dependencies.

