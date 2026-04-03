

## Plano: Unificar Cockpit + Painel Executivo e Corrigir Cálculos

### Objetivo
Fundir as duas páginas em uma única rota `/executivo` com duas abas: **Resumo** (cockpit compacto) e **Detalhado** (painel executivo completo). Remover a rota `/cockpit`. Corrigir cálculos inconsistentes de MRR, clientes ativos e cancelados.

---

### Problemas Identificados nos Cálculos

1. **MRR no Executivo**: Usa `clientes.reduce(mensalidadeAtual)` que inclui TODOS os clientes do AppContext (não filtra por status "ativo"). Deve usar `clientesReceita.filter(statusCliente === "ativo")` como o Cockpit já faz.

2. **MRR histórico simulado**: O Executivo faz `factor = 1 - (i * 0.025)` — dados 100% fictícios. Deve usar dados reais de `financial_titles` agrupados por competência (como o `useCockpitCharts` já faz).

3. **Cancelados no useCockpitCharts**: Filtra `gte("created_at", sixMonthsAgo)` — só pega clientes criados nos últimos 6 meses. Clientes antigos cancelados recentemente não aparecem. Deve buscar TAMBÉM por `cancelled_at >= sixMonthsAgo`.

4. **Clientes Ativos no Executivo**: Usa `clientes.length` (AppContext) que NÃO filtra status. Deve ser `clients WHERE status = 'ativo'`.

---

### Alterações

#### 1. `src/pages/Executivo.tsx` — Página unificada com abas
- Adicionar `Tabs` com duas abas: "Resumo" e "Detalhado"
- **Aba Resumo**: Conteúdo do Cockpit atual (KpiPills + 4 mini-cards com sparklines)
- **Aba Detalhado**: Conteúdo atual do Executivo (KPIs grid + gráficos grandes + saúde dos clientes)
- Manter botão "Modo Foco" do Cockpit
- Corrigir cálculos:
  - `clientesAtivos` → `clientesReceita.filter(c => c.statusCliente === "ativo").length`
  - `receitaRecorrente` → soma de `valorMensalidade` somente dos ativos
  - Remover MRR simulado; usar dados de `useCockpitCharts` para sparklines/gráficos históricos

#### 2. `src/hooks/useCockpitCharts.ts` — Corrigir query de cancelados
- Alterar query de clientes para buscar separadamente:
  - Novos: `gte("created_at", sixMonthsAgo)`
  - Cancelados: busca separada com `gte("cancelled_at", sixMonthsAgo)` (sem filtro de `created_at`)

#### 3. `src/pages/Cockpit.tsx` — Remover
- Deletar o arquivo

#### 4. `src/App.tsx` — Atualizar rotas
- Remover import e rota de `Cockpit`
- Redirecionar `/cockpit` → `/executivo` (redirect para não quebrar bookmarks)

#### 5. `src/lib/sidebarModules.ts` — Limpar menu
- Remover item "Modo Cockpit"
- Renomear "Painel Executivo" para "Painel Executivo" (mantém, já que absorveu o cockpit)

#### 6. `src/hooks/useSmartCardStats.ts` — Remover referência `/cockpit`
- Garantir que stats de `/executivo` cubram o que `/cockpit` usava

---

### Detalhes Técnicos

**Query corrigida de cancelados:**
```sql
-- Busca 1: novos no período
SELECT created_at FROM clients WHERE created_at >= '6 meses atrás'

-- Busca 2: cancelados no período (independente de created_at)  
SELECT cancelled_at FROM clients WHERE cancelled_at >= '6 meses atrás'
```

**MRR real (já existe em useCockpitCharts):**
Usa `financial_titles WHERE type='receita' AND status='pago'` agrupado por `competency` — correto e sem simulação.

**Arquivos alterados:** 5 editados, 1 deletado
**Estimativa:** ~200 linhas de edição líquida

