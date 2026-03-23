

## Plano: Cards Inteligentes (Mini Dashboards) no ModuleNavGrid

### Resumo
Evoluir o componente `ModuleNavGrid` para exibir indicadores em tempo real dentro de cada card de navegação, transformando-os em mini dashboards sem perder a função de navegação.

### Arquitetura

1. **Hook centralizado: `src/hooks/useSmartCardStats.ts`** (Novo)
   - Um único hook que faz queries ao banco para todas as métricas necessárias
   - Retorna um `Record<string, CardStats>` mapeado por URL do submódulo
   - Usa `react-query` com `staleTime` de 60s para evitar chamadas excessivas
   - Cada entrada retorna: `{ mainValue, mainLabel, secondaryValue, secondaryLabel, trend, sparklineData? }`
   - Queries agrupadas por módulo para minimizar chamadas

2. **Métricas por card (baseadas nas tabelas existentes)**:

| Card (URL) | Indicador principal | Secundário |
|---|---|---|
| `/clientes` | Total clientes ativos | Novos no mês |
| `/receita` | MRR atual (soma monthly_value_final) | Variação % vs mês anterior |
| `/checkout-interno` | — (sem métrica) | — |
| `/propostas` | Propostas enviadas no mês | Taxa de conversão % |
| `/crm` | Leads ativos (status != ganho/perdido) | Novos no mês |
| `/comercial` | Propostas aceitas no mês | Valor total aceito |
| `/parceiros` | Parceiros ativos | — |
| `/financeiro` | Receita do mês (títulos receber pagos) | Títulos em atraso |
| `/financeiro/contas-a-receber` | Total a receber (aberto) | Em atraso |
| `/financeiro/contas-a-pagar` | Total a pagar (aberto) | Vencendo esta semana |
| `/suporte` | Tickets abertos | Em andamento |
| `/tarefas` | Tarefas pendentes | Em andamento |
| `/cartoes` | Clientes de maquininha ativos | — |

3. **Componente atualizado: `ModuleNavGrid.tsx`**
   - Importar o hook `useSmartCardStats`
   - Dentro de cada card, abaixo do título/descrição, renderizar:
     - Valor principal em texto bold (ex: "42 ativos")
     - Badge de tendência (verde ↑ / vermelho ↓) quando disponível
     - Mini sparkline opcional (via `recharts` Sparkline, 40x16px) para métricas com histórico
   - Cards sem dados disponíveis mantêm o layout atual (apenas ícone + título + descrição)
   - Skeleton loading enquanto dados carregam
   - O card fica ligeiramente mais alto (~p-5 em vez de p-4) para acomodar os indicadores

4. **Detalhes visuais**
   - Indicador principal: `text-lg font-bold` com cor semântica do módulo
   - Badge de tendência: verde para positivo, vermelho para negativo, cinza para neutro
   - Sparkline: stroke com a cor do módulo, sem eixos, apenas a linha
   - Tooltip no indicador com explicação (ex: "MRR: Receita recorrente mensal")
   - Transição suave nos valores ao atualizar

### Arquivos editados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSmartCardStats.ts` | **Novo** — hook com queries para métricas dos cards |
| `src/components/layout/ModuleNavGrid.tsx` | Integrar métricas, sparklines, badges de tendência |

### Notas técnicas
- Todas as queries usam as tabelas existentes (`clients`, `proposals`, `financial_titles`, `portal_tickets`, `tasks`, `card_clients`) — sem alteração de banco
- `staleTime: 60_000` e `refetchOnWindowFocus: true` para balance entre atualização e performance
- Sparklines usam dados dos últimos 6 meses quando disponíveis (agrupando por competência)
- Cards de módulos sem dados relevantes (ex: Configurações, Checkout) permanecem apenas visuais

