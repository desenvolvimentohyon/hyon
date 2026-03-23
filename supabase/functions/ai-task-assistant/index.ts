import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const parseTaskTool = {
  type: "function",
  function: {
    name: "parse_task",
    description: "Parse a natural language task description into structured task fields",
    parameters: {
      type: "object",
      properties: {
        titulo: { type: "string", description: "Task title, concise and clear" },
        descricao: { type: "string", description: "Task description with relevant details" },
        clienteNome: { type: "string", description: "Client name if mentioned" },
        prioridade: { type: "string", enum: ["baixa", "media", "alta", "urgente"] },
        tipoOperacional: { type: "string", enum: ["comercial", "implantacao", "suporte", "treinamento", "financeiro", "interno"] },
        prazoDataHora: { type: "string", description: "ISO 8601 datetime if a date/time is mentioned" },
        responsavelNome: { type: "string", description: "Responsible person name if mentioned" },
      },
      required: ["titulo", "descricao", "prioridade", "tipoOperacional"],
      additionalProperties: false,
    },
  },
};

const suggestTasksTool = {
  type: "function",
  function: {
    name: "suggest_tasks",
    description: "Generate task suggestions based on system data",
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
              clienteNome: { type: "string" },
              prioridade: { type: "string", enum: ["baixa", "media", "alta", "urgente"] },
              tipoOperacional: { type: "string", enum: ["comercial", "implantacao", "suporte", "treinamento", "financeiro", "interno"] },
              motivo: { type: "string", description: "Why this task is suggested" },
            },
            required: ["titulo", "descricao", "prioridade", "tipoOperacional", "motivo"],
            additionalProperties: false,
          },
        },
      },
      required: ["suggestions"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { type, text, context } = await req.json();

    let systemPrompt: string;
    let userPrompt: string;
    let tools: any[];
    let toolChoice: any;

    if (type === "suggest") {
      systemPrompt = `Você é um assistente de gestão empresarial. Analise os dados do sistema e sugira tarefas proativas e úteis.
Regras:
- Sugira entre 2 e 5 tarefas relevantes
- Priorize ações urgentes (cobranças, certificados vencendo)
- Use linguagem profissional e objetiva em português
- Cada sugestão deve ter um motivo claro`;

      userPrompt = `Dados do sistema:\n${JSON.stringify(context, null, 2)}\n\nGere sugestões de tarefas baseadas nesses dados.`;
      tools = [suggestTasksTool];
      toolChoice = { type: "function", function: { name: "suggest_tasks" } };
    } else {
      const today = new Date().toISOString().split("T")[0];
      const dayOfWeek = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][new Date().getDay()];

      systemPrompt = `Você é um assistente inteligente de tarefas empresariais. Interprete comandos em linguagem natural e extraia os campos da tarefa.
Hoje é ${dayOfWeek}, ${today}.
Regras:
- Se o usuário mencionar "hoje", use a data de hoje
- Se mencionar "amanhã", use o dia seguinte
- Se mencionar dias da semana, calcule a próxima ocorrência
- Se não mencionar horário, não inclua prazoDataHora
- Detecte prioridade pelo tom: "urgente", "importante" = alta/urgente; padrão = media
- Detecte o tipo operacional pelo contexto (instalar/migrar = implantacao, cobrar = financeiro, etc.)
- Clientes e responsáveis disponíveis: ${JSON.stringify(context?.clientes?.map((c: any) => c.nome) || [])}
- Técnicos disponíveis: ${JSON.stringify(context?.tecnicos?.map((t: any) => t.nome) || [])}`;

      userPrompt = text;
      tools = [parseTaskTool];
      toolChoice = { type: "function", function: { name: "parse_task" } };
    }

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
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: toolChoice,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Configurações." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("AI gateway error: " + status);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-task-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
