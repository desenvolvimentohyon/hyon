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
    let totalRecurCommissions = 0;

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
        .select("id, client_id, due_at, status, org_id, description, value_final, competency")
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

        // === Recurring commission on_invoice_created ===
        if (title.competency && title.client_id && title.status === "aberto") {
          try {
            const { data: client } = await supabase.from("clients")
              .select("ref_partner_id, ref_partner_start_at, ref_partner_recur_percent, ref_partner_recur_months, ref_partner_recur_apply_on, status")
              .eq("id", title.client_id)
              .single();

            if (client?.ref_partner_id && client.ref_partner_recur_apply_on === "on_invoice_created" && client.ref_partner_recur_percent && client.ref_partner_recur_percent > 0 && client.status !== "cancelado") {
              // Check period eligibility
              let eligible = true;
              if (client.ref_partner_recur_months && client.ref_partner_recur_months > 0 && client.ref_partner_start_at) {
                const startDate = new Date(client.ref_partner_start_at);
                const [compYear, compMonth] = title.competency.split("-").map(Number);
                const monthsDiff = (compYear - startDate.getFullYear()) * 12 + (compMonth - (startDate.getMonth() + 1));
                if (monthsDiff >= client.ref_partner_recur_months) eligible = false;
              }

              if (eligible) {
                // Check idempotency
                const { data: existingComm } = await supabase.from("financial_titles")
                  .select("id")
                  .eq("org_id", org.id)
                  .eq("commission_type", "recorrente")
                  .eq("partner_id", client.ref_partner_id)
                  .eq("reference_title_id", title.id)
                  .eq("competency", title.competency)
                  .limit(1);

                if (!existingComm || existingComm.length === 0) {
                  const commissionValue = Math.round((title.value_final || 0) * client.ref_partner_recur_percent / 100 * 100) / 100;
                  if (commissionValue > 0) {
                    const commDueDate = new Date(title.due_at!);
                    commDueDate.setDate(commDueDate.getDate() + 7);
                    await supabase.from("financial_titles").insert({
                      org_id: org.id,
                      type: "pagar",
                      origin: "comissao_parceiro",
                      commission_type: "recorrente",
                      partner_id: client.ref_partner_id,
                      reference_title_id: title.id,
                      client_id: title.client_id,
                      competency: title.competency,
                      description: `Comissão recorrente ${title.competency}`,
                      value_original: commissionValue,
                      value_final: commissionValue,
                      due_at: commDueDate.toISOString().split("T")[0],
                      status: "aberto",
                    });
                    totalRecurCommissions++;
                  }
                }
              }
            }
          } catch (_err) {
            // Skip on error for this title
          }
        }

        totalProcessed++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed: totalProcessed, notifications: totalNotifications, tasks: totalTasks, recurCommissions: totalRecurCommissions }),
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
