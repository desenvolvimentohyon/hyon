import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // 1. Fetch all orgs with alerts enabled
    const { data: companies, error: compErr } = await supabase
      .from("company_profile")
      .select("org_id, trade_name, renewal_alert_enabled, renewal_alert_days, renewal_whatsapp, renewal_email, renewal_whatsapp_template, renewal_email_template, renewal_template")
      .eq("renewal_alert_enabled", true);

    if (compErr) throw compErr;
    if (!companies || companies.length === 0) {
      return new Response(JSON.stringify({ message: "No orgs with alerts enabled", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const defaultWhatsappTemplate = `Olá, {cliente_nome} 👋\nSeu plano {plano_nome} vence em {dias_restantes} dias (vencimento: {data_vencimento}).\n\nPara renovar de forma rápida, acesse:\n{link_renovacao}\n\nQualquer dúvida, me chame por aqui.\n{nome_empresa}`;
    const defaultEmailTemplate = `Olá {cliente_nome},\nSeu plano {plano_nome} vence em {dias_restantes} dias (vencimento: {data_vencimento}).\nPara solicitar a renovação, acesse: {link_renovacao}\n\nAtenciosamente,\n{nome_empresa}`;

    let totalSent = 0;
    const results: any[] = [];

    for (const company of companies) {
      const alertDays = company.renewal_alert_days || 7;
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + alertDays);
      const futureDateStr = futureDate.toISOString().slice(0, 10);

      // 2. Fetch active clients with plan_end_date in range, non-mensal plans
      const { data: clients, error: clientErr } = await supabase
        .from("clients")
        .select("id, name, trade_name, phone, email, billing_plan, plan_end_date, monthly_value_final, portal_token, primary_contact_phone, primary_contact_email, billing_phone, billing_email")
        .eq("org_id", company.org_id)
        .eq("status", "ativo")
        .not("plan_end_date", "is", null)
        .gte("plan_end_date", todayStr)
        .lte("plan_end_date", futureDateStr)
        .in("billing_plan", ["trimestral", "semestral", "anual"]);

      if (clientErr || !clients || clients.length === 0) continue;

      // 3. Check existing notification_logs for these clients
      const clientIds = clients.map(c => c.id);
      const { data: existingLogs } = await supabase
        .from("notification_logs")
        .select("client_id, channel, plan_end_date")
        .eq("org_id", company.org_id)
        .eq("type", "plan_renewal")
        .in("client_id", clientIds);

      const logSet = new Set(
        (existingLogs || []).map(l => `${l.client_id}|${l.channel}|${l.plan_end_date}`)
      );

      const whatsappTemplate = company.renewal_whatsapp_template || defaultWhatsappTemplate;
      const emailTemplate = company.renewal_email_template || defaultEmailTemplate;
      const origin = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "") || "";

      for (const client of clients) {
        const endDate = client.plan_end_date;
        const end = new Date(endDate + "T00:00:00");
        const nowDate = new Date(todayStr + "T00:00:00");
        const daysLeft = Math.ceil((end.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));

        const renewalLink = client.portal_token
          ? `${origin}/renovar/${client.portal_token}`
          : "";

        const clientName = client.trade_name || client.name;
        const planName = client.billing_plan || "mensal";
        const formattedDate = end.toLocaleDateString("pt-BR");

        const replaceVars = (template: string) =>
          template
            .replace(/{cliente_nome}/g, clientName)
            .replace(/{plano_nome}/g, planName)
            .replace(/{data_vencimento}/g, formattedDate)
            .replace(/{dias_restantes}/g, String(daysLeft))
            .replace(/{valor_mensalidade}/g, (client.monthly_value_final || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))
            .replace(/{link_renovacao}/g, renewalLink)
            .replace(/{nome_empresa}/g, company.trade_name || "");

        // WhatsApp
        if (company.renewal_whatsapp) {
          const key = `${client.id}|whatsapp|${endDate}`;
          if (!logSet.has(key)) {
            const phone = (client.billing_phone || client.primary_contact_phone || client.phone || "").replace(/\D/g, "");
            const message = replaceVars(whatsappTemplate);
            const whatsappUrl = phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(message)}` : null;

            await supabase.from("notification_logs").insert({
              org_id: company.org_id,
              client_id: client.id,
              type: "plan_renewal",
              channel: "whatsapp",
              target: phone || null,
              plan_end_date: endDate,
              status: "sent",
            });

            totalSent++;
            results.push({ client: clientName, channel: "whatsapp", whatsapp_url: whatsappUrl });
          }
        }

        // Email
        if (company.renewal_email) {
          const key = `${client.id}|email|${endDate}`;
          if (!logSet.has(key)) {
            const email = client.billing_email || client.primary_contact_email || client.email || "";
            const message = replaceVars(emailTemplate);

            await supabase.from("notification_logs").insert({
              org_id: company.org_id,
              client_id: client.id,
              type: "plan_renewal",
              channel: "email",
              target: email || null,
              plan_end_date: endDate,
              status: "sent",
            });

            totalSent++;
            results.push({ client: clientName, channel: "email", target: email });
          }
        }
      }
    }

    return new Response(JSON.stringify({ sent: totalSent, details: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
