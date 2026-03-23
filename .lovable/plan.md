

## Plano: IA de Retenção e Churn

### Resumo
Adicionar modo `churn_analysis` à edge function `ai-consultant` e criar componente `AiRetencaoAssistant` que calcula score de churn por cliente, explica riscos, sugere ações de retenção e inclui chat conversacional. Integrado ao Dashboard e acessível como seção dentro da página de Clientes.

### 1. Edge Function: `ai-consultant/index.ts` (atualizar)

Novo modo `type: "churn_analysis"` que recebe contexto de clientes com dados cruzados (financeiro, suporte, renovações) e retorna via tool calling:

```
Tool: churn_diagnosis
{
  resumo: string (markdown),
  clientes_risco: [{
    nome, score_churn (0-100), classificacao: "alto"|"medio"|"baixo",
    motivos: string[], receita_mensal, impacto_cancelamento,
    acoes_sugeridas: [{ titulo, tipo: "tarefa"|"contato"|"proposta"|"desconto" }]
  }],
  metricas: { total_risco_alto, total_risco_medio, churn_mes_atual, retencao_pct, valor_em_risco },
  alertas: [{ prioridade, titulo, descricao }],
  recuperacao: [{ nome, cancelado_ha_dias, receita_anterior, sugestao }]
}
```

Também `type: "churn_chat"` para perguntas conversacionais sobre retenção.

### 2. Novo hook: `src/hooks/useChurnAnalysis.ts`

Agrega dados por cliente via queries paralelas:
- `clients` com status, `monthly_value_final`, `health_score`, `cancelled_at`
- `financial_titles` → inadimplência por cliente (títulos vencidos com `client_id`)
- `portal_tickets` → contagem de tickets por cliente no último mês
- `tasks` → tarefas de suporte vinculadas
- `clients.metadata` → `plan_end_date` para renovações pendentes

Calcula score de churn client-side (ponderado: inadimplência 30%, suporte 20%, health_score 30%, renovação 20%) e envia top 20 clientes por risco à edge function para análise enriquecida pela IA.

`staleTime: 300_000`.

### 3. Novo componente: `src/components/ai/AiRetencaoAssistant.tsx`

Card com seções colapsáveis:

**Seção 1 — Resumo de Retenção**
- KPIs: clientes em risco alto, churn do mês, taxa de retenção, valor em risco (R$)
- Resumo markdown gerado pela IA

**Seção 2 — Clientes em Risco**
- Lista ordenada por score (alto → baixo)
- Cada cliente: nome, score (badge colorido), motivos, receita mensal, impacto
- Botões: "Criar tarefa" / "Abrir cliente" / "Ignorar"

**Seção 3 — Recuperação**
- Clientes cancelados que podem ser reativados
- Sugestão de ação + botão "Gerar proposta"

**Seção 4 — Chat de Retenção**
- Perguntas como "quais clientes posso perder esse mês?"

### 4. Integração

| Página | Mudança |
|--------|---------|
| `src/pages/Dashboard.tsx` | Versão compacta (KPIs + top 3 clientes em risco) abaixo dos outros assistentes |
| `src/pages/Clientes.tsx` | Inserir `<AiRetencaoAssistant />` completo acima da lista |

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/ai-consultant/index.ts` | Adicionar modos `churn_analysis` e `churn_chat` |
| `src/hooks/useChurnAnalysis.ts` | **Novo** — agregação de dados e score de churn |
| `src/components/ai/AiRetencaoAssistant.tsx` | **Novo** — UI do painel de retenção |
| `src/pages/Clientes.tsx` | Inserir componente completo |
| `src/pages/Dashboard.tsx` | Inserir versão compacta |

### Notas técnicas
- Sem alteração de banco — usa `clients`, `financial_titles`, `portal_tickets`, `tasks`
- Score de churn calculado client-side para resposta imediata; IA enriquece com análise contextual
- Reutiliza a mesma edge function `ai-consultant`
- Top 20 clientes por risco enviados à IA (não todos) para otimizar contexto

