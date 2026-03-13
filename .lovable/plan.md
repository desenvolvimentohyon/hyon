

## Plano: Padronização Completa de Layout e UX

### Diagnóstico de Inconsistências Identificadas

Após análise de todas as páginas, os principais problemas são:

1. **PageHeader**: Apenas `Clientes` usa o componente `PageHeader`. Suporte, Receita, Financeiro, Tarefas, Comercial, Implantação, Parceiros e Tecnicos usam headers ad-hoc com estilos diferentes
2. **KPIs**: Dashboard usa `grid-cols-5`, Suporte usa `grid-cols-6`, Receita não tem grid padronizado — layouts inconsistentes
3. **Tabs**: Suporte usa `TabsList` padrão do Radix, ClienteDetalhe usa tabs com ícones e borda customizada, Configurações usa SubtabGrid — 3 estilos diferentes
4. **Tabelas**: Clientes tem hover e RowActions, Propostas tem DropdownMenu custom, Parceiros/Tecnicos não têm hover consistente
5. **Empty States**: Apenas Clientes usa `EmptyState` component, demais não tratam estado vazio
6. **Espaçamento**: Páginas usam `space-y-4`, `space-y-6` e `space-y-8` inconsistentemente

### Abordagem

Criar componentes reutilizáveis e refatorar cada página para usá-los, sem alterar lógica ou dados.

### Componentes a Criar/Atualizar

| Componente | Ação |
|-----------|------|
| `src/components/ui/page-header.tsx` | **Editar** — adicionar prop `icon` com cor semântica do módulo |
| `src/components/ui/kpi-grid.tsx` | **Criar** — componente padronizado para KPIs com grid `cols-5` (desktop), `cols-2` (mobile), tooltip |
| `src/components/ui/section-tabs.tsx` | **Criar** — wrapper de Tabs com estilo padronizado (ícone + label, mesma altura/espaçamento) |
| `src/components/ui/table.tsx` | **Editar** — adicionar hover padrão nas rows (`hover:bg-accent/40 transition-colors duration-150`) |

### Páginas a Refatorar

| Página | Mudanças |
|--------|----------|
| `Suporte.tsx` | PageHeader com ícone, KpiGrid padronizado (cols-5 em vez de cols-6), SectionTabs |
| `Receita.tsx` | PageHeader, KpiGrid padronizado |
| `Executivo.tsx` | PageHeader |
| `Comercial.tsx` | PageHeader |
| `Implantacao.tsx` | PageHeader, EmptyState |
| `Tarefas.tsx` | PageHeader |
| `Parceiros.tsx` | PageHeader, hover em tabela, EmptyState |
| `Tecnicos.tsx` | PageHeader, hover em tabela, EmptyState |
| `ClientesReceita.tsx` | PageHeader |
| `FinanceiroVisaoGeral.tsx` | PageHeader, KpiGrid padronizado |
| `ContasReceber.tsx` | PageHeader |
| `ContasPagar.tsx` | PageHeader |
| `CRM.tsx` | PageHeader |
| `ClienteDetalhe.tsx` | Padronizar tabs para usar mesmo estilo visual (altura, espaçamento uniforme) |

### Padrões a Aplicar

**PageHeader em todas as páginas:**
```tsx
<PageHeader icon={Headphones} iconColor="text-orange-600" title="Suporte Técnico" actions={...} />
```

**KPI Grid padronizado (5 colunas desktop, 3 tablet, 2 mobile):**
```tsx
<div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
```

**Espaçamento raiz padronizado:**
Todas as páginas: `<div className="space-y-6">`

**Tabs padronizadas:**
Altura fixa, ícones com 3.5, gap 1.5, rounded-md, transição 150ms. Estilo ativo: `bg-primary text-primary-foreground`.

**Tabelas com hover:**
`TableRow className="hover:bg-accent/40 transition-colors duration-150"`

**Empty states:**
Usar `EmptyState` em todas as tabelas/listas que podem estar vazias.

### Cores semânticas por módulo (já existentes no design system)

- Dashboard/Estrutura → `text-primary` (azul)
- Financeiro → `text-success` (verde)
- Suporte → `text-orange-600`
- CRM/Comercial → `text-indigo-600`
- Implantação → `text-violet-500`
- Receita → `text-primary`
- Configurações → `text-muted-foreground`
- Parceiros → `text-amber-600`

### O que NÃO será alterado
- Nenhuma lógica de negócio
- Nenhuma rota
- Nenhum banco de dados
- Nenhuma funcionalidade existente removida
- Apenas refatoração visual e estrutural

### Escopo de entrega

Estimativa: ~14 arquivos editados, 2 componentes novos. Foco nos elementos de maior impacto visual: headers, KPIs, tabs e tabelas.

