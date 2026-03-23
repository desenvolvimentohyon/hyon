import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, prompt, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let tools: any[] = [];
    let toolChoice: any = undefined;
    let userPrompt = prompt || "";

    if (type === "create") {
      systemPrompt = `Você é um assistente de gestão de tarefas para uma software house. O usuário vai descrever algo que precisa fazer e você deve estruturar isso como uma tarefa.
Considere o contexto do negócio: suporte técnico, implantação de sistemas, comercial, financeiro, treinamento.
Use a ferramenta create_task para retornar a tarefa estruturada. Sempre responda em português brasileiro.
Hoje é ${new Date().toISOString().split("T")[0]}.`;

      tools = [{
        type: "function",
        function: {
          name: "create_task",
          description: "Cria uma tarefa estruturada a partir da descrição do usuário",
          parameters: {
            type: "object",
            properties: {
              titulo: { type: "string", description: "Título curto e objetivo da tarefa" },
              descricao: { type: "string", description: "Descrição detalhada da tarefa" },
              prioridade: { type: "string", enum: ["baixa", "media", "alta", "urgente"] },
              tipoOperacional: { type: "string", enum: ["comercial", "implantacao", "suporte", "treinamento", "financeiro", "interno"] },
              prazoSugerido: { type: "string", description: "Data prazo sugerida no formato YYYY-MM-DD" },
              tags: { type: "array", items: { type: "string" }, description: "Tags relevantes" },
            },
            required: ["titulo", "descricao", "prioridade", "tipoOperacional"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "create_task" } };

    } else if (type === "suggest") {
      systemPrompt = `Você é um assistente inteligente de uma software house. Com base nos dados do sistema fornecidos, sugira de 3 a 5 tarefas acionáveis que o usuário deveria realizar.
Foque em ações práticas: cobranças, verificações, follow-ups, conferências.
Sempre responda em português brasileiro.
Hoje é ${new Date().toISOString().split("T")[0]}.`;

      userPrompt = `Dados do sistema:\n${JSON.stringify(context || {}, null, 2)}\n\nSugira tarefas com base nesses dados.`;

      tools = [{
        type: "function",
        function: {
          name: "suggest_tasks",
          description: "Retorna sugestões de tarefas baseadas nos dados do sistema",
          parameters: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    titulo: { type: "string" },
                    descricao: { type: "string" },
                    prioridade: { type: "string", enum: ["baixa", "media", "alta", "urgente"] },
                    tipoOperacional: { type: "string", enum: ["comercial", "implantacao", "suporte", "treinamento", "financeiro", "interno"] },
                    tags: { type: "array", items: { type: "string" } },
                  },
                  required: ["titulo", "descricao", "prioridade", "tipoOperacional"],
                  additionalProperties: false,
                },
              },
            },
            required: ["suggestions"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "suggest_tasks" } };

    } else if (type === "daily") {
      systemPrompt = `Você é um assistente de rotina diária de uma software house. Gere de 4 a 6 tarefas de rotina para o dia de trabalho.
Considere atividades como: conferir caixa, verificar contas a pagar, cobrar clientes em atraso, revisar pendências, acompanhar implantações.
Use os dados do sistema fornecidos para personalizar as tarefas.
Sempre responda em português brasileiro.
Hoje é ${new Date().toISOString().split("T")[0]}.`;

      userPrompt = `Dados do sistema:\n${JSON.stringify(context || {}, null, 2)}\n\nGere as tarefas do dia.`;

      tools = [{
        type: "function",
        function: {
          name: "suggest_tasks",
          description: "Retorna tarefas do dia",
          parameters: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    titulo: { type: "string" },
                    descricao: { type: "string" },
                    prioridade: { type: "string", enum: ["baixa", "media", "alta", "urgente"] },
                    tipoOperacional: { type: "string", enum: ["comercial", "implantacao", "suporte", "treinamento", "financeiro", "interno"] },
                    tags: { type: "array", items: { type: "string" } },
                  },
                  required: ["titulo", "descricao", "prioridade", "tipoOperacional"],
                  additionalProperties: false,
                },
              },
            },
            required: ["suggestions"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "suggest_tasks" } };
    } else {
      return new Response(JSON.stringify({ error: "Tipo inválido. Use: create, suggest, daily" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools,
      tool_choice: toolChoice,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos nas configurações." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "IA não retornou dados estruturados" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ type, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-task-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
