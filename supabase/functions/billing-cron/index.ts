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

    const today = new Date().toISOString().split("T")[0];

    // Get all orgs
    const { data: orgs } = await supabase.from("organizations").select("id");
    if (!orgs) return new Response(JSON.stringify({ ok: true, processed: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let totalProcessed = 0;
    let totalNotifications = 0;
    let totalTasks = 0;

    for (const org of orgs) {
      // Get billing rules for this org
      const { data: rules } = await supabase
        .from("billing_rules")
        .select("*")
        .eq("org_id", org.id)
        .single();

      // Use defaults if no rules configured
      const daysBefore = rules?.days_before || [5];
      const onDueDay = rules?.on_due_day ?? true;
      const daysAfter = rules?.days_after || [3, 7, 15];
      const autoTask = rules?.auto_task ?? true;

      // Get open/overdue titles for this org
      const { data: titles } = await supabase
        .from("financial_titles")
        .select("id, client_id, due_at, status, org_id, description")
        .eq("org_id", org.id)
        .eq("type", "receber")
        .in("status", ["aberto", "vencido"])
        .not("due_at", "is", null)
        .not("client_id", "is", null);

      if (!titles || titles.length === 0) continue;

      for (const title of titles) {
        const dueDate = new Date(title.due_at!);
        const todayDate = new Date(today);
        const diffDays = Math.round((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

        let notificationType: string | null = null;

        if (diffDays > 0 && daysBefore.includes(diffDays)) {
          notificationType = `pre_vencimento_${diffDays}d`;
        } else if (diffDays === 0 && onDueDay) {
          notificationType = "vencimento_hoje";
        } else if (diffDays < 0) {
          const daysLate = Math.abs(diffDays);
          if (daysAfter.includes(daysLate)) {
            notificationType = `atraso_${daysLate}d`;
          }

          // Update status to vencido if still aberto
          if (title.status === "aberto") {
            await supabase
              .from("financial_titles")
              .update({ status: "vencido" })
              .eq("id", title.id);
          }

          // Auto task at 7+ days late
          if (autoTask && daysLate >= 7 && daysLate % 7 === 0) {
            // Check if task already exists for this title
            const { data: existingTasks } = await supabase
              .from("tasks")
              .select("id")
              .eq("org_id", org.id)
              .eq("client_id", title.client_id)
              .contains("tags", ["cobranca_auto"])
              .eq("status", "a_fazer")
              .limit(1);

            if (!existingTasks || existingTasks.length === 0) {
              await supabase.from("tasks").insert({
                org_id: org.id,
                client_id: title.client_id,
                title: `Cobrança manual - ${title.description}`,
                description: `Título com ${daysLate} dias de atraso. Realizar contato de cobrança.`,
                tipo_operacional: "financeiro",
                priority: daysLate >= 15 ? "alta" : "media",
                tags: ["cobranca_auto"],
              });
              totalTasks++;
            }
          }
        }

        // Create notification if type determined
        if (notificationType) {
          // Check if already sent today
          const { data: existing } = await supabase
            .from("billing_notifications")
            .select("id")
            .eq("title_id", title.id)
            .eq("type", notificationType)
            .gte("sent_at", today)
            .limit(1);

          if (!existing || existing.length === 0) {
            await supabase.from("billing_notifications").insert({
              org_id: org.id,
              client_id: title.client_id,
              title_id: title.id,
              type: notificationType,
              channel: "interno",
            });
            totalNotifications++;
          }
        }

        totalProcessed++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed: totalProcessed, notifications: totalNotifications, tasks: totalTasks }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("billing-cron error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
