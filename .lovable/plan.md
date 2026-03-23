

## Plano: IA Gestora Financeira

### Resumo
Adicionar um novo modo `financial_analysis` à edge function `ai-consultant` e criar um componente `AiFinanceiroAssistant` que agrega dados financeiros detalhados e os envia à IA para gerar diagnóstico, alertas, recomendações e análise de lucratividade por cliente. Inclui chat conversacional financeiro e é integrado ao Financeiro Visão Geral e ao Dashboard.

### Arquitetura: 3 arquivos

### 1. Edge Function: `ai-consultant/index.ts` (atualizar)

Adicionar modo `type: "financial_analysis"` que recebe contexto financeiro detalhado e retorna via tool calling:

```
Tool: financial_diagnosis
{
  resumo: string (markdown),
  alertas: [{ prioridade, categoria, titulo, descricao, acao_sugerida }],
  recomendacoes: [{ titulo, descricao, tipo_acao, cliente_nome?, impacto }],
  lucratividade_clientes: [{ nome, receita, custo, margem, classificacao: "saudavel"|"atencao"|"critico" }],
  projecoes: { mrr_atual, arr_atual, ticket_medio, margem_pct, inadimplencia_pct, tendencia: "crescimento"|"estavel"|"queda" },
  cenarios: [{ descricao, impacto_mrr, impacto_margem }]
}
```

Contexto enviado ao prompt inclui: MRR, ARR, ticket médio, margem, custos totais, inadimplência, top 10 clientes por receita com seus custos, títulos vencidos, renovações pendentes, propostas com desconto alto.

Reutiliza o modo `chat` existente com contexto financeiro enriquecido quando `type: "financial_chat"`.

### 2. Novo hook: `src/hooks/useFinancialDiagnosis.ts`

Agrega dados financeiros via queries paralelas ao Supabase:
- `clients` com `monthly_value_final`, `monthly_cost_value`, `cost_active`, `status`
- `financial_titles` para calcular receita/despesa por competência, inadimplência
- `proposals` com descontos altos e valor do funil
- Calcula MRR, ARR, ticket médio, margem, custos totais, top clientes por lucratividade

Envia contexto à edge function e retorna diagnóstico estruturado.
`staleTime: 300_000`, `refetchOnWindowFocus: true`.

### 3. Novo componente: `src/components/ai/AiFinanceiroAssistant.tsx`

Card visual com seções colapsáveis:

**Seção 1 — Diagnóstico Financeiro**
- Resumo em markdown com métricas inline (MRR, ARR, margem, inadimplência)
- Grid de KPIs: MRR, ticket médio, margem %, inadimplência %
- Badge de tendência (crescimento/estável/queda)

**Seção 2 — Alertas e Recomendações**
- Alertas priorizados (vermelho/laranja/verde) com ações rápidas
- Recomendações com botões: Criar tarefa / Abrir cliente / Ignorar

**Seção 3 — Lucratividade por Cliente**
- Top clientes com receita, custo, margem e classificação por cor (saudável/atenção/crítico)

**Seção 4 — Cenários e Projeções**
- Cenários gerados pela IA (ex: "Se reduzir inadimplência em 10%...")
- Impacto estimado no MRR e margem

**Seção 5 — Chat Financeiro**
- Campo de input para perguntas como "Qual sistema gera mais lucro?"
- Streaming SSE via modo `financial_chat`

### 4. Integração

| Página | Mudança |
|--------|---------|
| `src/pages/financeiro/FinanceiroVisaoGeral.tsx` | Inserir `<AiFinanceiroAssistant />` após ModuleNavGrid |
| `src/pages/Dashboard.tsx` | Inserir versão compacta (apenas resumo + alertas) abaixo do `AiExecutiveAssistant` |

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/ai-consultant/index.ts` | Adicionar modos `financial_analysis` e `financial_chat` |
| `src/hooks/useFinancialDiagnosis.ts` | **Novo** — agregação de dados financeiros |
| `src/components/ai/AiFinanceiroAssistant.tsx` | **Novo** — UI do diagnóstico financeiro |
| `src/pages/financeiro/FinanceiroVisaoGeral.tsx` | Inserir componente |
| `src/pages/Dashboard.tsx` | Inserir versão compacta |

### Notas técnicas
- Sem alteração de banco — usa tabelas existentes (`clients`, `financial_titles`, `proposals`)
- Reutiliza a mesma edge function `ai-consultant` para economizar infraestrutura
- Queries com `select` limitado e `count` para performance
- Top 10 clientes por receita enviados à IA para análise de lucratividade (não todos)

