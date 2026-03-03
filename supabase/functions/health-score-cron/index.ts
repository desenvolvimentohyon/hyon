import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // Get all active clients
    const { data: clients } = await supabase
      .from("clients")
      .select("id, org_id, created_at, status, cancelled_at");

    if (!clients || clients.length === 0) {
      return new Response(JSON.stringify({ ok: true, updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;

    for (const client of clients) {
      let score = 100;

      // 1. Títulos vencidos (-20 cada)
      const { count: overdueCount } = await supabase
        .from("financial_titles")
        .select("id", { count: "exact", head: true })
        .eq("client_id", client.id)
        .eq("type", "receber")
        .eq("status", "vencido");

      score -= (overdueCount || 0) * 20;

      // 2. Chamados de suporte nos últimos 90 dias (-5 por chamado acima de 3)
      const { count: supportCount } = await supabase
        .from("support_events")
        .select("id", { count: "exact", head: true })
        .eq("client_id", client.id)
        .gte("created_at", ninetyDaysAgo);

      const excessSupport = Math.max(0, (supportCount || 0) - 3);
      score -= excessSupport * 5;

      // 3. Tempo como cliente (+10 por ano, máx 30)
      const yearsAsClient = (now.getTime() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
      score += Math.min(30, Math.floor(yearsAsClient) * 10);

      // 4. Status cancelado anterior (-30)
      if (client.cancelled_at) {
        score -= 30;
      }

      // Clamp 0-100
      score = Math.max(0, Math.min(100, score));

      // Determine status
      let healthStatus: string;
      if (score >= 80) healthStatus = "verde";
      else if (score >= 50) healthStatus = "amarelo";
      else healthStatus = "vermelho";

      // Update
      await supabase
        .from("clients")
        .update({ health_score: score, health_status: healthStatus })
        .eq("id", client.id);

      updated++;
    }

    return new Response(JSON.stringify({ ok: true, updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("health-score-cron error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
