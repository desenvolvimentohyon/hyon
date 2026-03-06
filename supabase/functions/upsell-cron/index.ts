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
    const cronSecret = req.headers.get("x-cron-secret");
    if (cronSecret !== Deno.env.get("CRON_SECRET")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // Get active clients with good health, created > 3 months ago
    const { data: clients } = await supabase
      .from("clients")
      .select("id, org_id, health_score")
      .eq("status", "ativo")
      .gte("health_score", 70)
      .lte("created_at", threeMonthsAgo);

    if (!clients || clients.length === 0) {
      return new Response(JSON.stringify({ ok: true, suggestions: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let suggestionsCreated = 0;

    for (const client of clients) {
      // Get all modules for this org
      const { data: allModules } = await supabase
        .from("system_modules")
        .select("id")
        .eq("org_id", client.org_id)
        .eq("active", true);

      if (!allModules || allModules.length === 0) continue;

      // Check existing pending suggestions for this client
      const { data: existingSuggestions } = await supabase
        .from("upsell_suggestions")
        .select("suggested_module_id")
        .eq("client_id", client.id)
        .eq("status", "pendente");

      const existingModuleIds = new Set(
        (existingSuggestions || []).map((s) => s.suggested_module_id)
      );

      // For simplicity, suggest the first module not already suggested
      for (const mod of allModules) {
        if (!existingModuleIds.has(mod.id)) {
          await supabase.from("upsell_suggestions").insert({
            org_id: client.org_id,
            client_id: client.id,
            suggested_module_id: mod.id,
            status: "pendente",
          });
          suggestionsCreated++;
          break; // One suggestion per client per run
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, suggestions: suggestionsCreated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("upsell-cron error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
