import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const payload = await req.json();
    const type = payload.type || "commercial";

    // ─── EXECUTIVE BRIEFING ─────────────────────────────────────────
    if (type === "executive_briefing") {
      const ctx = payload.context || {};
      const userName = payload.userName || "Usuário";
      const hora = payload.hora || new Date().getHours();
      const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

      const systemPrompt = `Você é um assistente executivo corporativo de alto nível para um sistema de gestão de revendas de software ERP.
Seu papel é ser um "Jarvis corporativo": direto, estratégico, proativo.

Contexto do sistema agora:
- Nome do usuário: ${userName}
- Saudação: ${saudacao}, ${userName}
- Clientes ativos: ${ctx.clientesAtivos ?? 0}
- Clientes em atraso: ${ctx.clientesAtraso ?? 0}
- Novos clientes no mês: ${ctx.clientesNovosMes ?? 0}
- Certificados vencendo em 30 dias: ${ctx.certVencendo ?? 0}
- MRR atual: R$ ${(ctx.mrr ?? 0).toFixed(2)}
- Títulos financeiros vencidos (abertos): ${ctx.titulosVencidos ?? 0}
- Valor em atraso: R$ ${(ctx.valorAtraso ?? 0).toFixed(2)}
- Propostas abertas: ${ctx.propostasAbertas ?? 0}
- Propostas sem visualização: ${ctx.propostasSemView ?? 0}
- Propostas aceitas no mês: ${ctx.propostasAceitasMes ?? 0}
- Tarefas pendentes: ${ctx.tarefasPendentes ?? 0}
- Tarefas urgentes: ${ctx.tarefasUrgentes ?? 0}
- Tarefas atrasadas: ${ctx.tarefasAtrasadas ?? 0}
- Tickets de suporte abertos: ${ctx.ticketsAbertos ?? 0}
- Planos vencendo em 7 dias: ${ctx.planosVencendo ?? 0}
- Comissões pendentes: ${ctx.comissoesPendentes ?? 0}

Analise o contexto e retorne um briefing executivo completo usando a ferramenta fornecida.
Seja direto, prático, em português do Brasil. Use emojis moderadamente para dar vida ao texto.
Priorize alertas por gravidade. Sugira ações concretas.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Gere o briefing executivo do dia." },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "executive_briefing",
                description: "Retorna briefing executivo estruturado do dia",
                parameters: {
                  type: "object",
                  properties: {
                    saudacao: { type: "string", description: "Saudação personalizada com nome do usuário" },
                    resumoDia: { type: "string", description: "Resumo executivo do dia em markdown (3-5 parágrafos)" },
                    alertas: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
                          categoria: { type: "string", enum: ["comercial", "financeiro", "clientes", "suporte", "renovacoes"] },
                          titulo: { type: "string" },
                          descricao: { type: "string" },
                          acao_sugerida: { type: "string" },
                        },
                        required: ["prioridade", "categoria", "titulo", "descricao", "acao_sugerida"],
                        additionalProperties: false,
                      },
                    },
                    sugestoes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          titulo: { type: "string" },
                          descricao: { type: "string" },
                          tipo_acao: { type: "string", enum: ["tarefa", "contato", "proposta", "cobranca", "renovacao"] },
                        },
                        required: ["titulo", "descricao", "tipo_acao"],
                        additionalProperties: false,
                      },
                    },
                    metricas: {
                      type: "object",
                      properties: {
                        mrr: { type: "number" },
                        clientes_ativos: { type: "number" },
                        inadimplentes: { type: "number" },
                        propostas_abertas: { type: "number" },
                        tickets_abertos: { type: "number" },
                        tarefas_pendentes: { type: "number" },
                      },
                      required: ["mrr", "clientes_ativos", "inadimplentes", "propostas_abertas", "tickets_abertos", "tarefas_pendentes"],
                      additionalProperties: false,
                    },
                  },
                  required: ["saudacao", "resumoDia", "alertas", "sugestoes", "metricas"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "executive_briefing" } },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        const text = await response.text();
        console.error("AI gateway error:", status, text);
        if (status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        return new Response(JSON.stringify({ error: "IA não retornou briefing estruturado" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const briefing = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(briefing), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── FINANCIAL ANALYSIS ────────────────────────────────────────
    if (type === "financial_analysis") {
      const ctx = payload.context || {};

      const systemPrompt = `Você é uma IA gestora financeira especialista em empresas de revenda de software ERP/SaaS.
Analise os dados financeiros abaixo e forneça um diagnóstico completo, alertas, recomendações e cenários de crescimento.

Dados financeiros atuais:
- MRR: R$ ${(ctx.mrr ?? 0).toFixed(2)}
- ARR: R$ ${(ctx.arr ?? 0).toFixed(2)}
- Ticket Médio: R$ ${(ctx.ticketMedio ?? 0).toFixed(2)}
- Custos totais: R$ ${(ctx.custos ?? 0).toFixed(2)}
- Margem: R$ ${(ctx.margem ?? 0).toFixed(2)} (${(ctx.margemPct ?? 0).toFixed(1)}%)
- Inadimplência total: R$ ${(ctx.inadimplenciaTotal ?? 0).toFixed(2)} (${(ctx.inadimplenciaPct ?? 0).toFixed(1)}%)
- Tendência: ${ctx.tendencia ?? "estavel"}
- Clientes ativos: ${ctx.clientesAtivos ?? 0}
- Títulos vencidos: ${ctx.titulosVencidos ?? 0}
- Receita mês atual: R$ ${(ctx.receitaMesAtual ?? 0).toFixed(2)}
- Receita mês anterior: R$ ${(ctx.receitaMesAnterior ?? 0).toFixed(2)}
- Propostas abertas: ${ctx.propostasAbertas ?? 0}
- Valor no funil: R$ ${(ctx.valorFunilPropostas ?? 0).toFixed(2)}

Top 10 clientes por receita:
${(ctx.topClients || []).map((c: any) => `- ${c.nome}: Receita R$ ${c.receita.toFixed(2)}, Custo R$ ${c.custo.toFixed(2)}, Margem R$ ${(c.receita - c.custo).toFixed(2)}, Sistema: ${c.sistema}, Health: ${c.health}`).join("\n")}

Analise e retorne o diagnóstico usando a ferramenta fornecida. Seja direto, prático, em português do Brasil.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Gere o diagnóstico financeiro completo." },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "financial_diagnosis",
                description: "Retorna diagnóstico financeiro estruturado",
                parameters: {
                  type: "object",
                  properties: {
                    resumo: { type: "string", description: "Resumo executivo financeiro em markdown (3-5 parágrafos)" },
                    alertas: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
                          categoria: { type: "string", enum: ["receita", "custos", "inadimplencia", "margem", "fluxo_caixa", "renovacoes", "propostas"] },
                          titulo: { type: "string" },
                          descricao: { type: "string" },
                          acao_sugerida: { type: "string" },
                        },
                        required: ["prioridade", "categoria", "titulo", "descricao", "acao_sugerida"],
                        additionalProperties: false,
                      },
                    },
                    recomendacoes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          titulo: { type: "string" },
                          descricao: { type: "string" },
                          tipo_acao: { type: "string", enum: ["cobranca", "proposta", "upsell", "revisao", "contato", "tarefa"] },
                          cliente_nome: { type: "string" },
                          impacto: { type: "string" },
                        },
                        required: ["titulo", "descricao", "tipo_acao", "impacto"],
                        additionalProperties: false,
                      },
                    },
                    lucratividade_clientes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          nome: { type: "string" },
                          receita: { type: "number" },
                          custo: { type: "number" },
                          margem: { type: "number" },
                          classificacao: { type: "string", enum: ["saudavel", "atencao", "critico"] },
                        },
                        required: ["nome", "receita", "custo", "margem", "classificacao"],
                        additionalProperties: false,
                      },
                    },
                    projecoes: {
                      type: "object",
                      properties: {
                        mrr_atual: { type: "number" },
                        arr_atual: { type: "number" },
                        ticket_medio: { type: "number" },
                        margem_pct: { type: "number" },
                        inadimplencia_pct: { type: "number" },
                        tendencia: { type: "string", enum: ["crescimento", "estavel", "queda"] },
                      },
                      required: ["mrr_atual", "arr_atual", "ticket_medio", "margem_pct", "inadimplencia_pct", "tendencia"],
                      additionalProperties: false,
                    },
                    cenarios: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          descricao: { type: "string" },
                          impacto_mrr: { type: "string" },
                          impacto_margem: { type: "string" },
                        },
                        required: ["descricao", "impacto_mrr", "impacto_margem"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["resumo", "alertas", "recomendacoes", "lucratividade_clientes", "projecoes", "cenarios"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "financial_diagnosis" } },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        return new Response(JSON.stringify({ error: "IA não retornou diagnóstico" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const diagnosis = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(diagnosis), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── CHURN ANALYSIS ────────────────────────────────────────────
    if (type === "churn_analysis") {
      const ctx = payload.context || {};

      const systemPrompt = `Você é uma IA especialista em retenção de clientes e análise de churn para empresas de revenda de software ERP/SaaS.
Analise os dados dos clientes e identifique riscos de cancelamento, explique motivos e sugira ações de retenção.

Dados atuais:
- Clientes ativos: ${ctx.clientesAtivos ?? 0}
- Churn do mês: ${ctx.churnMes ?? 0}
- Clientes risco alto: ${ctx.riscoAlto ?? 0}
- Clientes risco médio: ${ctx.riscoMedio ?? 0}
- Valor em risco: R$ ${(ctx.valorEmRisco ?? 0).toFixed(2)}
- Taxa de retenção: ${(ctx.retencaoPct ?? 0).toFixed(1)}%

Top clientes por risco:
${(ctx.topClientes || []).map((c: any) => `- ${c.nome}: Score ${c.score}, ${c.classificacao}, Receita R$ ${c.receita.toFixed(2)}, Health ${c.healthScore}, Títulos vencidos: ${c.titulosVencidos}, Renovação pendente: ${c.renovacaoPendente ? "Sim" : "Não"}`).join("\n")}

Clientes cancelados recentemente (possível recuperação):
${(ctx.recuperacao || []).map((c: any) => `- ${c.nome}: cancelado há ${c.canceladoHaDias} dias, receita anterior R$ ${c.receitaAnterior.toFixed(2)}`).join("\n") || "Nenhum"}

Analise e retorne o diagnóstico de churn usando a ferramenta. Seja direto, prático, em português do Brasil.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Gere o diagnóstico de churn e retenção." },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "churn_diagnosis",
                description: "Retorna diagnóstico de churn e retenção estruturado",
                parameters: {
                  type: "object",
                  properties: {
                    resumo: { type: "string", description: "Resumo de retenção em markdown (2-4 parágrafos)" },
                    clientes_risco: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          nome: { type: "string" },
                          score_churn: { type: "number" },
                          classificacao: { type: "string", enum: ["alto", "medio", "baixo"] },
                          motivos: { type: "array", items: { type: "string" } },
                          receita_mensal: { type: "number" },
                          impacto_cancelamento: { type: "string" },
                          acoes_sugeridas: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                titulo: { type: "string" },
                                tipo: { type: "string", enum: ["tarefa", "contato", "proposta", "desconto"] },
                              },
                              required: ["titulo", "tipo"],
                              additionalProperties: false,
                            },
                          },
                        },
                        required: ["nome", "score_churn", "classificacao", "motivos", "receita_mensal", "impacto_cancelamento", "acoes_sugeridas"],
                        additionalProperties: false,
                      },
                    },
                    metricas: {
                      type: "object",
                      properties: {
                        total_risco_alto: { type: "number" },
                        total_risco_medio: { type: "number" },
                        churn_mes_atual: { type: "number" },
                        retencao_pct: { type: "number" },
                        valor_em_risco: { type: "number" },
                      },
                      required: ["total_risco_alto", "total_risco_medio", "churn_mes_atual", "retencao_pct", "valor_em_risco"],
                      additionalProperties: false,
                    },
                    alertas: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
                          titulo: { type: "string" },
                          descricao: { type: "string" },
                        },
                        required: ["prioridade", "titulo", "descricao"],
                        additionalProperties: false,
                      },
                    },
                    recuperacao: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          nome: { type: "string" },
                          cancelado_ha_dias: { type: "number" },
                          receita_anterior: { type: "number" },
                          sugestao: { type: "string" },
                        },
                        required: ["nome", "cancelado_ha_dias", "receita_anterior", "sugestao"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["resumo", "clientes_risco", "metricas", "alertas", "recuperacao"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "churn_diagnosis" } },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        return new Response(JSON.stringify({ error: "IA não retornou diagnóstico de churn" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const diagnosis = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(diagnosis), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── GROWTH RADAR ───────────────────────────────────────────────
    if (type === "growth_radar") {
      const ctx = payload.context || {};

      const systemPrompt = `Você é uma IA estrategista de crescimento para empresas de revenda de software ERP/SaaS.
Analise os dados e identifique oportunidades de crescimento, perdas financeiras e projete cenários futuros.

Dados atuais:
- MRR: R$ ${(ctx.mrr ?? 0).toFixed(2)}
- ARR: R$ ${(ctx.arr ?? 0).toFixed(2)}
- Ticket Médio: R$ ${(ctx.ticketMedio ?? 0).toFixed(2)}
- Clientes ativos: ${ctx.clientesAtivos ?? 0}
- Churn: ${(ctx.churnPct ?? 0).toFixed(1)}%
- Retenção: ${(ctx.retencaoPct ?? 0).toFixed(1)}%
- Crescimento mensal: ${(ctx.crescimentoPct ?? 0).toFixed(1)}%
- Receita perdida (inadimplência): R$ ${(ctx.receitaPerdida ?? 0).toFixed(2)}
- Potencial de upsell estimado: R$ ${(ctx.potencialUpsell ?? 0).toFixed(2)}
- Propostas abertas: ${ctx.propostasAbertas ?? 0}
- Valor no funil: R$ ${(ctx.valorFunil ?? 0).toFixed(2)}
- Propostas esquecidas (sem view >7d): ${ctx.propostasEsquecidas ?? 0}

Top oportunidades (clientes com potencial):
${(ctx.topOportunidades || []).map((c: any) => `- ${c.nome}: Receita R$ ${c.receita.toFixed(2)}, ${c.modulosContratados}/${c.totalModulos} módulos, ${c.planoAnual ? "Anual" : "Mensal"}, Health ${c.health}`).join("\n")}

Perdas identificadas:
${(ctx.topPerdas || []).map((p: any) => `- ${p.nome}: ${p.tipo} - ${p.descricao} (R$ ${p.valor.toFixed(2)})`).join("\n")}

Clientes para reativação:
${(ctx.reativacao || []).map((c: any) => `- ${c.nome}: cancelado há ${c.canceladoHaDias} dias, receita anterior R$ ${c.receitaAnterior.toFixed(2)}`).join("\n") || "Nenhum"}

Analise e retorne o diagnóstico de crescimento usando a ferramenta. Seja direto, prático, em português do Brasil.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: \`Bearer \${LOVABLE_API_KEY}\`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Gere o diagnóstico do radar de crescimento." },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "growth_radar",
                description: "Retorna diagnóstico de crescimento estruturado",
                parameters: {
                  type: "object",
                  properties: {
                    diagnostico: { type: "string", description: "Diagnóstico estratégico em markdown (3-5 parágrafos)" },
                    oportunidades: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          tipo: { type: "string", enum: ["upsell", "plano_anual", "expansao", "reativacao"] },
                          cliente_nome: { type: "string" },
                          receita_atual: { type: "number" },
                          potencial_adicional: { type: "number" },
                          acao_sugerida: { type: "string" },
                          prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
                        },
                        required: ["tipo", "cliente_nome", "receita_atual", "potencial_adicional", "acao_sugerida", "prioridade"],
                        additionalProperties: false,
                      },
                    },
                    perdas: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          tipo: { type: "string", enum: ["inadimplencia", "margem_baixa", "churn", "desconto_excessivo"] },
                          cliente_nome: { type: "string" },
                          valor_impacto: { type: "number" },
                          descricao: { type: "string" },
                        },
                        required: ["tipo", "cliente_nome", "valor_impacto", "descricao"],
                        additionalProperties: false,
                      },
                    },
                    projecoes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          cenario: { type: "string" },
                          impacto_mrr: { type: "string" },
                          impacto_margem: { type: "string" },
                        },
                        required: ["cenario", "impacto_mrr", "impacto_margem"],
                        additionalProperties: false,
                      },
                    },
                    metricas: {
                      type: "object",
                      properties: {
                        crescimento_mensal_pct: { type: "number" },
                        churn_pct: { type: "number" },
                        retencao_pct: { type: "number" },
                        ticket_medio: { type: "number" },
                        potencial_upsell_total: { type: "number" },
                        receita_perdida_total: { type: "number" },
                      },
                      required: ["crescimento_mensal_pct", "churn_pct", "retencao_pct", "ticket_medio", "potencial_upsell_total", "receita_perdida_total"],
                      additionalProperties: false,
                    },
                    alertas: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
                          titulo: { type: "string" },
                          descricao: { type: "string" },
                        },
                        required: ["prioridade", "titulo", "descricao"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["diagnostico", "oportunidades", "perdas", "projecoes", "metricas", "alertas"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "growth_radar" } },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        return new Response(JSON.stringify({ error: "IA não retornou diagnóstico de crescimento" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const diagnosis = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(diagnosis), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── GROWTH CHAT ────────────────────────────────────────────────
    if (type === "growth_chat") {
      const ctx = payload.context || {};
      const messages = payload.messages || [];

      const systemPrompt = `Você é uma IA estrategista de crescimento para empresas de revenda de software ERP/SaaS.
Responda perguntas sobre crescimento, oportunidades e estratégia. Seja direto e estratégico, em português do Brasil.

Dados atuais:
- MRR: R$ ${(ctx.mrr ?? 0).toFixed(2)}
- Clientes ativos: ${ctx.clientesAtivos ?? 0}
- Churn: ${(ctx.churnPct ?? 0).toFixed(1)}%
- Retenção: ${(ctx.retencaoPct ?? 0).toFixed(1)}%
- Crescimento: ${(ctx.crescimentoPct ?? 0).toFixed(1)}%
- Potencial upsell: R$ ${(ctx.potencialUpsell ?? 0).toFixed(2)}
- Receita perdida: R$ ${(ctx.receitaPerdida ?? 0).toFixed(2)}
- Valor no funil: R$ ${(ctx.valorFunil ?? 0).toFixed(2)}

Responda em markdown quando útil. Seja conciso e forneça insights acionáveis.`;

      const aiMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: \`Bearer \${LOVABLE_API_KEY}\`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Limite excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "Sem resposta.";
      return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── CHURN CHAT ─────────────────────────────────────────────────
    if (type === "churn_chat") {
      const ctx = payload.context || {};
      const messages = payload.messages || [];

      const systemPrompt = `Você é uma IA especialista em retenção de clientes para empresas de revenda de software ERP/SaaS.
Responda perguntas sobre retenção, churn e risco de cancelamento. Seja direto e estratégico, em português do Brasil.

Dados atuais:
- Clientes risco alto: ${ctx.riscoAlto ?? 0}
- Clientes risco médio: ${ctx.riscoMedio ?? 0}
- Churn do mês: ${ctx.churnMes ?? 0}
- Retenção: ${(ctx.retencaoPct ?? 0).toFixed(1)}%
- Valor em risco: R$ ${(ctx.valorEmRisco ?? 0).toFixed(2)}

Responda em markdown quando útil. Seja conciso e forneça insights acionáveis.`;

      const aiMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: \`Bearer \${LOVABLE_API_KEY}\`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Limite excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "Sem resposta.";
      return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── FINANCIAL CHAT ─────────────────────────────────────────────
    if (type === "financial_chat") {
      const ctx = payload.context || {};
      const messages = payload.messages || [];

      const systemPrompt = `Você é uma IA gestora financeira especialista em empresas de revenda de software ERP/SaaS.
Responda perguntas sobre o financeiro usando os dados reais. Seja direto e estratégico, em português do Brasil.

Dados financeiros:
- MRR: R$ ${(ctx.mrr ?? 0).toFixed(2)}
- ARR: R$ ${(ctx.arr ?? 0).toFixed(2)}
- Ticket Médio: R$ ${(ctx.ticketMedio ?? 0).toFixed(2)}
- Custos: R$ ${(ctx.custos ?? 0).toFixed(2)}
- Margem: R$ ${(ctx.margem ?? 0).toFixed(2)} (${(ctx.margemPct ?? 0).toFixed(1)}%)
- Inadimplência: R$ ${(ctx.inadimplenciaTotal ?? 0).toFixed(2)} (${(ctx.inadimplenciaPct ?? 0).toFixed(1)}%)
- Clientes ativos: ${ctx.clientesAtivos ?? 0}
- Propostas abertas: ${ctx.propostasAbertas ?? 0}

Responda em markdown quando útil. Seja conciso e forneça insights acionáveis.`;

      const aiMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Limite excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "Sem resposta.";
      return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── COMMAND INTERPRETATION ──────────────────────────────────────
    if (type === "command") {
      const userText = payload.text || "";
      const currentRoute = payload.currentRoute || "/";
      const userPermissions = payload.permissions || [];

      const commandSystemPrompt = `Você é o Jarvis, assistente de comando total de um sistema de gestão de revendas de software ERP.
Sua função é interpretar comandos do usuário (falados ou digitados) e mapeá-los para ações do sistema.

Rotas/módulos disponíveis:
- "/" → Dashboard / Visão Geral
- "/executivo" → Painel Executivo
- "/radar-crescimento" → Radar de Crescimento
- "/clientes" → Cadastro de Clientes
- "/receita" → Receita / MRR
- "/checkout-interno" → Checkout Interno
- "/propostas" → Propostas
- "/crm" → CRM / Pipeline
- "/comercial" → Painel Comercial
- "/parceiros" → Parceiros
- "/financeiro" → Visão Geral Financeira
- "/financeiro/contas-a-receber" → Contas a Receber
- "/financeiro/contas-a-pagar" → Contas a Pagar
- "/financeiro/lancamentos" → Lançamentos
- "/financeiro/plano-de-contas" → Plano de Contas
- "/financeiro/conciliacao-bancaria" → Conciliação Bancária
- "/financeiro/relatorios" → Relatórios Financeiros
- "/financeiro/configuracoes" → Configurações Financeiras
- "/suporte" → Suporte
- "/tarefas" → Tarefas
- "/implantacao" → Implantação
- "/tecnicos" → Técnicos
- "/cartoes" → Dashboard Cartões
- "/cartoes/clientes" → Clientes Cartões
- "/cartoes/propostas" → Propostas Cartões
- "/cartoes/faturamento" → Faturamento Cartões
- "/configuracoes" → Configurações / Minha Empresa
- "/usuarios" → Usuários e Permissões

Rota atual: ${currentRoute}
Permissões do usuário: ${userPermissions.length > 0 ? userPermissions.join(", ") : "todas (admin)"}

Ações suportadas:
- navigate: navegar para um módulo
- create: abrir formulário de criação (tarefa, proposta, cliente)
- query: pergunta sobre dados do sistema (delegar para chat)
- action: executar ação operacional
- unknown: comando não reconhecido

Regras:
1. Se o comando é claramente uma navegação (ex: "abrir clientes"), retorne intent=navigate com a rota.
2. Se o comando pede criação (ex: "criar proposta"), retorne intent=create com entity_type e a rota do módulo.
3. Se o comando é uma pergunta sobre dados (ex: "quais clientes estão em atraso?"), retorne intent=query com fallback_chat=true.
4. Se o comando é ambíguo ou não reconhecido, retorne intent=unknown.
5. Ações sensíveis (excluir, gerar cobrança, cancelar) devem ter requires_confirmation=true.
6. Sempre forneça spoken_response em português natural e curto (1-2 frases).
7. Se o usuário mencionar um nome de cliente/entidade, extraia em entity_name.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: commandSystemPrompt },
            { role: "user", content: userText },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "jarvis_command",
                description: "Interpreta e executa comando do usuário no sistema",
                parameters: {
                  type: "object",
                  properties: {
                    intent: { type: "string", enum: ["navigate", "create", "query", "action", "unknown"] },
                    route: { type: "string", description: "Rota do sistema para navegar" },
                    entity_type: { type: "string", description: "Tipo da entidade (tarefa, proposta, cliente, etc)" },
                    entity_name: { type: "string", description: "Nome da entidade mencionada" },
                    params: { type: "object", description: "Parâmetros extras extraídos do comando" },
                    requires_confirmation: { type: "boolean", description: "Se a ação exige confirmação" },
                    confirmation_message: { type: "string", description: "Mensagem de confirmação" },
                    spoken_response: { type: "string", description: "Resposta falada/textual do Jarvis" },
                    fallback_chat: { type: "boolean", description: "Se true, redirecionar para chat normal" },
                  },
                  required: ["intent", "spoken_response"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "jarvis_command" } },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Limite excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Erro ao interpretar comando" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        return new Response(JSON.stringify({ intent: "unknown", spoken_response: "Não consegui interpretar o comando.", fallback_chat: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const command = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(command), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── CHAT CONVERSACIONAL ────────────────────────────────────────
    if (type === "chat") {
      const ctx = payload.context || {};
      const messages = payload.messages || [];

      const systemPrompt = `Você é um assistente executivo inteligente de um sistema de gestão de revendas de software ERP.
Responda perguntas sobre o negócio usando os dados do sistema. Seja direto e objetivo, em português do Brasil.

Dados atuais do sistema:
- Clientes ativos: ${ctx.clientesAtivos ?? 0}
- Clientes em atraso: ${ctx.clientesAtraso ?? 0}
- MRR: R$ ${(ctx.mrr ?? 0).toFixed(2)}
- Títulos vencidos: ${ctx.titulosVencidos ?? 0}
- Valor em atraso: R$ ${(ctx.valorAtraso ?? 0).toFixed(2)}
- Propostas abertas: ${ctx.propostasAbertas ?? 0}
- Propostas aceitas no mês: ${ctx.propostasAceitasMes ?? 0}
- Tarefas pendentes: ${ctx.tarefasPendentes ?? 0}
- Tarefas urgentes: ${ctx.tarefasUrgentes ?? 0}
- Tickets de suporte abertos: ${ctx.ticketsAbertos ?? 0}
- Planos vencendo em 7 dias: ${ctx.planosVencendo ?? 0}
- Certificados vencendo em 30 dias: ${ctx.certVencendo ?? 0}

Responda em markdown quando útil. Seja conciso.`;

      const aiMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua pergunta.";
      return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── COMMERCIAL ANALYSIS (existing) ─────────────────────────────
    const systemPrompt = `Você é uma consultora comercial especialista em vendas de software ERP/SaaS.
Analise os dados da proposta comercial e forneça recomendações estratégicas para maximizar a chance de fechamento mantendo margem saudável.

Dados da proposta:
- Sistema: ${payload.sistemaNome || "Não selecionado"} (R$ ${(payload.sistemaValor || 0).toFixed(2)}/mês)
- Módulos selecionados: ${payload.modulosCount || 0} (total R$ ${(payload.modulosValor || 0).toFixed(2)}/mês)
- Módulos disponíveis: ${payload.modulosDisponiveis || 0}
- Plano: ${payload.planoNome || "Não selecionado"} (desconto ${payload.descontoPercent || 0}%)
- Mensalidade base: R$ ${(payload.mensalidadeBase || 0).toFixed(2)}
- Mensalidade final: R$ ${(payload.mensalidadeFinal || 0).toFixed(2)}
- Implantação total: R$ ${(payload.implantacaoTotal || 0).toFixed(2)}
- Distância (km): ${payload.distanciaKm || 0}
- Dias de implantação: ${payload.dias || 0}
- Região: ${payload.regiaoNome || "Não selecionada"}
- Parceiro indicador: ${payload.parceiroNome || "Nenhum"}
- Comissão implantação: R$ ${(payload.comissaoImpl || 0).toFixed(2)}
- Comissão recorrente: R$ ${(payload.comissaoRecur || 0).toFixed(2)}
- Fluxo implantação: ${payload.fluxoImplantacao || "a_vista"}
- Parcelas: ${payload.parcelasImplantacao || 1}

Planos disponíveis para comparação:
${(payload.planosDisponiveis || []).map((p: any) => `- ${p.nome}: ${p.desconto}% desconto, ${p.meses} meses`).join("\n")}

Analise e use a ferramenta para retornar suas recomendações estruturadas em português do Brasil.
Seja direto, prático e estratégico. Foque em ações concretas.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analise esta proposta e forneça suas recomendações comerciais estruturadas." },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "commercial_analysis",
              description: "Retorna análise comercial estruturada da proposta",
              parameters: {
                type: "object",
                properties: {
                  score_fechamento: { type: "number", description: "Score de 0 a 100 indicando chance de fechamento" },
                  classificacao: { type: "string", enum: ["baixa", "media", "alta"], description: "Classificação da chance de fechamento" },
                  recomendacao_principal: { type: "string", description: "Recomendação principal em 1-2 frases" },
                  alertas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tipo: { type: "string", enum: ["risco", "atencao", "oportunidade"] },
                        mensagem: { type: "string" },
                      },
                      required: ["tipo", "mensagem"],
                      additionalProperties: false,
                    },
                  },
                  sugestao_plano: { type: "string", description: "Sugestão sobre plano ideal ou null" },
                  sugestao_desconto: { type: "string", description: "Sugestão sobre desconto ou null" },
                  sugestao_modulos: { type: "string", description: "Sugestão sobre módulos ou null" },
                  sugestao_implantacao: { type: "string", description: "Sugestão sobre implantação ou null" },
                  sugestao_upsell: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de oportunidades de upsell",
                  },
                  sugestao_retencao: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de sugestões de retenção se score baixo",
                  },
                  margem_avaliacao: { type: "string", enum: ["baixa", "ideal", "alta"], description: "Avaliação da margem da proposta" },
                  cenario_recomendado: { type: "string", description: "Descrição do cenário ideal recomendado" },
                },
                required: [
                  "score_fechamento", "classificacao", "recomendacao_principal",
                  "alertas", "margem_avaliacao", "cenario_recomendado",
                  "sugestao_upsell", "sugestao_retencao",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "commercial_analysis" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "IA não retornou análise estruturada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-consultant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
