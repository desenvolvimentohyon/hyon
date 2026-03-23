

## Plano: Radar de Crescimento com IA

### Resumo
Criar uma nova página `/radar-crescimento` com IA que analisa dados existentes para identificar oportunidades de crescimento, perdas e projeções. Reutiliza a edge function `ai-consultant` com novo modo `growth_radar`. Adiciona ao menu Dashboard como submódulo.

### Arquitetura: 4 arquivos

### 1. Edge Function: `ai-consultant/index.ts` (atualizar)

Novo modo `type: "growth_radar"` que recebe contexto agregado (MRR, clientes, propostas, churn, módulos contratados) e retorna via tool calling:

```
Tool: growth_radar
{
  diagnostico: string (markdown),
  oportunidades: [{
    tipo: "upsell" | "plano_anual" | "expansao" | "reativacao",
    cliente_nome, receita_atual, potencial_adicional,
    acao_sugerida, prioridade: "alta" | "media" | "baixa"
  }],
  perdas: [{
    tipo: "inadimplencia" | "margem_baixa" | "churn" | "desconto_excessivo",
    cliente_nome, valor_impacto, descricao
  }],
  projecoes: [{
    cenario, impacto_mrr, impacto_margem
  }],
  metricas: {
    crescimento_mensal_pct, churn_pct, retencao_pct,
    ticket_medio, potencial_upsell_total, receita_perdida_total
  },
  alertas: [{ prioridade, titulo, descricao }]
}
```

Também `type: "growth_chat"` para perguntas conversacionais.

### 2. Novo hook: `src/hooks/useGrowthRadar.ts`

Agrega dados via queries paralelas:
- `clients`: ativos com receita, custo, módulos, status, health_score
- `client_modules`: contagem de módulos por cliente vs total disponível
- `financial_titles`: inadimplência, receita perdida
- `proposals`: funil aberto, propostas esquecidas (sem visualização há >7d)
- Clientes cancelados recentes para reativação

Calcula: potencial de upsell (clientes com poucos módulos), candidatos a plano anual (metadata.billing_plan), receita perdida por inadimplência.

Envia contexto à edge function. `staleTime: 300_000`.

### 3. Nova página: `src/pages/RadarCrescimento.tsx`

Página completa com:

- **PageHeader** com ícone Rocket e cor verde
- **KPIs**: Crescimento mensal %, Churn %, Retenção %, Ticket médio, Potencial upsell, Receita perdida
- **Diagnóstico**: Resumo markdown da IA
- **Top Oportunidades**: Lista ranqueada com tipo (badge), cliente, potencial adicional, ação + botões (Criar tarefa / Abrir cliente / Gerar proposta)
- **Top Riscos/Perdas**: Lista com tipo, cliente, valor impacto
- **Cenários de Projeção**: Cards com impacto no MRR/margem
- **Chat Estratégico**: Input para perguntas como "onde posso crescer mais rápido?"

### 4. Integração

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Adicionar rota `/radar-crescimento` |
| `src/lib/sidebarModules.ts` | Adicionar submódulo "Radar de Crescimento" no grupo Dashboard |
| `src/pages/Dashboard.tsx` | Versão compacta (top 3 oportunidades + KPIs) |

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/ai-consultant/index.ts` | Adicionar modos `growth_radar` e `growth_chat` |
| `src/hooks/useGrowthRadar.ts` | **Novo** — agregação de dados para radar |
| `src/pages/RadarCrescimento.tsx` | **Novo** — página completa do radar |
| `src/App.tsx` | Nova rota |
| `src/lib/sidebarModules.ts` | Novo submódulo no Dashboard |
| `src/pages/Dashboard.tsx` | Card compacto do radar |

### Notas técnicas
- Sem alteração de banco — usa `clients`, `client_modules`, `financial_titles`, `proposals`
- Reutiliza edge function `ai-consultant` existente
- Potencial de upsell = módulos disponíveis no sistema - módulos contratados pelo cliente
- Candidatos a plano anual = clientes com `metadata.billing_plan` != 'anual' e com boa retenção

