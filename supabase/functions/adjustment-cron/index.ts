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

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();

    // Get all clients with adjustment configured
    const { data: clients } = await supabase
      .from("clients")
      .select("id, org_id, monthly_value_final, adjustment_base_date, adjustment_type, adjustment_percent, name")
      .eq("status", "ativo")
      .not("adjustment_base_date", "is", null)
      .not("adjustment_type", "is", null)
      .gt("adjustment_percent", 0);

    if (!clients || clients.length === 0) {
      return new Response(JSON.stringify({ ok: true, adjusted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let adjusted = 0;

    for (const client of clients) {
      const baseDate = new Date(client.adjustment_base_date);
      const baseMonth = baseDate.getMonth() + 1;
      const baseDay = baseDate.getDate();

      // Only adjust if current month/day matches the base date
      if (baseMonth !== currentMonth || baseDay !== currentDay) continue;

      // Check if already adjusted this year
      const yearStart = `${now.getFullYear()}-01-01`;
      const { data: existingAdj } = await supabase
        .from("contract_adjustments")
        .select("id")
        .eq("client_id", client.id)
        .gte("applied_at", yearStart)
        .limit(1);

      if (existingAdj && existingAdj.length > 0) continue;

      const oldValue = client.monthly_value_final;
      const percent = client.adjustment_percent;
      const newValue = Math.round((oldValue * (1 + percent / 100)) * 100) / 100;

      // Update client monthly value
      await supabase
        .from("clients")
        .update({ monthly_value_final: newValue })
        .eq("id", client.id);

      // Record in contract_adjustments
      await supabase.from("contract_adjustments").insert({
        org_id: client.org_id,
        client_id: client.id,
        old_value: oldValue,
        new_value: newValue,
        percent_applied: percent,
      });

      // Record in monthly_adjustments
      await supabase.from("monthly_adjustments").insert({
        org_id: client.org_id,
        client_id: client.id,
        previous_value: oldValue,
        new_value: newValue,
        reason: `Reajuste automático ${client.adjustment_type} (${percent}%)`,
      });

      // Create internal notification
      await supabase.from("billing_notifications").insert({
        org_id: client.org_id,
        client_id: client.id,
        type: "reajuste_aplicado",
        channel: "interno",
      });

      adjusted++;
    }

    return new Response(JSON.stringify({ ok: true, adjusted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("adjustment-cron error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
