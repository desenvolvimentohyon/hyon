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
