import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado." }, 401);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY ausente no ambiente." }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sessão inválida." }, 401);

    const payload = await req.json().catch(() => ({}));
    const question = payload?.question || "";
    const context = payload?.context || {};

    if (!question) return json({ error: "Pergunta é obrigatória." }, 400);

    const systemPrompt = `
      Você é um assistente inteligente especializado em ERP SaaS.
      Você ajuda o usuário a navegar no sistema, entender dados e tomar decisões.
      Contexto atual do sistema: ${JSON.stringify(context)}
      Responda de forma concisa, técnica e útil em português do Brasil.
    `;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text();
      return json({ error: `IA falhou: ${detail}` }, aiRes.status);
    }

    const data = await aiRes.json();
    return json({ answer: data.choices[0].message.content });

  } catch (err) {
    console.error("ia-assistant error", err);
    return json({ error: err instanceof Error ? err.message : "Erro inesperado." }, 500);
  }
});
