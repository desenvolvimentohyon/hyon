

## Plano: Card KPI de Cortesias no Financeiro

### Objetivo
Adicionar um card KPI no padrão existente (mesmo formato de "Saldo em Bancos", "MRR Atual", etc.) que mostre a quantidade de clientes com cortesia e o valor total das cortesias (baseado no valor de mensalidade original).

### Alterações

#### 1. `src/pages/financeiro/FinanceiroVisaoGeral.tsx`
- No `useMemo` de `kpis` (linha ~62): consultar `titulos` filtrando por `isCourtesy === true` no mês atual para obter:
  - `cortesiaCount`: quantidade de títulos de cortesia
  - `cortesiaValor`: soma dos valores de mensalidade dos clientes com cortesia (via cross-reference com `clientesReceita` ou via campo `valorOriginal` do título — como cortesias são geradas com valor 0, buscar o valor real do cliente)
- Adicionar novo card no array `kpiCards` (linha ~174):
  - `{ label: "Cortesias no Mês", value: "3 clientes", secondaryValue: "R$ 1.500", icon: Gift, color: "text-purple-400" }`
- O card mostrará quantidade de clientes no valor principal e o valor "perdido" em cortesias como subtexto

### Detalhes Técnicos
- Como os títulos de cortesia são salvos com `valorOriginal: 0`, o valor real da cortesia precisa vir do `monthly_value_final` do cliente (via `clientesReceita`) ou ser salvo no momento da geração. A abordagem mais simples: no momento da geração, salvar o valor original da mensalidade no campo `observacoes` ou em um campo dedicado. Alternativa: cruzar `client_id` do título com `clientesReceita` para pegar `valorMensalidade`.
- Vou usar a abordagem de cruzamento com dados do cliente para calcular o valor real das cortesias.
- O card segue exatamente o mesmo padrão visual dos demais KPIs (ícone + label + valor).

### Estimativa
~1 arquivo alterado (`FinanceiroVisaoGeral.tsx`), adição de ~15 linhas.

