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

  // Auth: require Authorization header with valid user or service role key
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate caller is authenticated
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      anonKey,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

      // 2. Fetch active clients with metadata containing plan_end_date
      const { data: clients, error: clientErr } = await supabase
        .from("clients")
        .select("id, name, trade_name, phone, email, metadata, monthly_value_final, portal_token, primary_contact_phone, primary_contact_email, billing_phone, billing_email")
        .eq("org_id", company.org_id)
        .eq("status", "ativo");

      if (clientErr || !clients || clients.length === 0) continue;

      // Filter in memory: only non-mensal plans with plan_end_date in range
      const eligibleClients = clients.filter((c: any) => {
        const meta = c.metadata || {};
        const planEndDate = meta.plan_end_date;
        const billingPlan = meta.billing_plan;
        if (!planEndDate) return false;
        if (!["trimestral", "semestral", "anual"].includes(billingPlan)) return false;
        return planEndDate >= todayStr && planEndDate <= futureDateStr;
      });

      if (eligibleClients.length === 0) continue;

      // 3. Check existing notification_logs for these clients
      const clientIds = eligibleClients.map((c: any) => c.id);
      const { data: existingLogs } = await supabase
        .from("notification_logs")
        .select("client_id, channel, plan_end_date")
        .eq("org_id", company.org_id)
        .eq("type", "plan_renewal")
        .in("client_id", clientIds);

      const logSet = new Set(
        (existingLogs || []).map((l: any) => `${l.client_id}|${l.channel}|${l.plan_end_date}`)
      );

      const whatsappTemplate = company.renewal_whatsapp_template || defaultWhatsappTemplate;
      const emailTemplate = company.renewal_email_template || defaultEmailTemplate;
      const origin = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "") || "";

      for (const client of eligibleClients) {
        const meta = (client as any).metadata || {};
        const endDate = meta.plan_end_date;
        const billingPlan = meta.billing_plan;
        const end = new Date(endDate + "T00:00:00");
        const nowDate = new Date(todayStr + "T00:00:00");
        const daysLeft = Math.ceil((end.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));

        const renewalLink = (client as any).portal_token
          ? `${origin}/renovar/${(client as any).portal_token}`
          : "";

        const clientName = (client as any).trade_name || (client as any).name;
        const planName = billingPlan || "mensal";
        const formattedDate = end.toLocaleDateString("pt-BR");

        const replaceVars = (template: string) =>
          template
            .replace(/{cliente_nome}/g, clientName)
            .replace(/{plano_nome}/g, planName)
            .replace(/{data_vencimento}/g, formattedDate)
            .replace(/{dias_restantes}/g, String(daysLeft))
            .replace(/{valor_mensalidade}/g, ((client as any).monthly_value_final || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))
            .replace(/{link_renovacao}/g, renewalLink)
            .replace(/{nome_empresa}/g, company.trade_name || "");

        // WhatsApp
        if (company.renewal_whatsapp) {
          const key = `${(client as any).id}|whatsapp|${endDate}`;
          if (!logSet.has(key)) {
            const phone = ((client as any).billing_phone || (client as any).primary_contact_phone || (client as any).phone || "").replace(/\D/g, "");
            const message = replaceVars(whatsappTemplate);
            const whatsappUrl = phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(message)}` : null;

            await supabase.from("notification_logs").insert({
              org_id: company.org_id,
              client_id: (client as any).id,
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
          const key = `${(client as any).id}|email|${endDate}`;
          if (!logSet.has(key)) {
            const email = (client as any).billing_email || (client as any).primary_contact_email || (client as any).email || "";
            const message = replaceVars(emailTemplate);

            await supabase.from("notification_logs").insert({
              org_id: company.org_id,
              client_id: (client as any).id,
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
