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
