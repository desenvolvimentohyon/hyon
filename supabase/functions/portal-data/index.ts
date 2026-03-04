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
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Token obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar cliente pelo token
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("portal_token", token)
      .single();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar plano do cliente
    let plan = null;
    if (client.plan_id) {
      const { data } = await supabase
        .from("plans")
        .select("*")
        .eq("id", client.plan_id)
        .single();
      plan = data;
    }

    // Buscar títulos financeiros do cliente
    const { data: titles } = await supabase
      .from("financial_titles")
      .select("id, description, value_original, value_final, discount, interest, fine, due_at, status, type, origin, competency, asaas_bank_slip_url, asaas_pix_payload, asaas_pix_qr_code, asaas_invoice_url")
      .eq("client_id", client.id)
      .eq("type", "receber")
      .order("due_at", { ascending: false })
      .limit(50);

    // Buscar org name
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", client.org_id)
      .single();

    // Buscar módulos do sistema do cliente
    let modules: { id: string; name: string; description: string | null }[] = [];
    if (client.system_name) {
      const { data: systemModules } = await supabase
        .from("system_modules")
        .select("id, name, description")
        .eq("org_id", client.org_id)
        .eq("active", true);
      modules = systemModules || [];
    }

    // Buscar tickets do portal
    const { data: tickets } = await supabase
      .from("portal_tickets")
      .select("id, title, description, status, created_at, updated_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Buscar mensagens dos tickets
    const ticketIds = (tickets || []).map(t => t.id);
    let ticketMessages: Record<string, { id: string; sender_type: string; sender_name: string; message: string; created_at: string }[]> = {};
    if (ticketIds.length > 0) {
      const { data: messages } = await supabase
        .from("portal_ticket_messages")
        .select("id, ticket_id, sender_type, sender_name, message, created_at")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: true });
      if (messages) {
        for (const m of messages) {
          if (!ticketMessages[m.ticket_id]) ticketMessages[m.ticket_id] = [];
          ticketMessages[m.ticket_id].push({
            id: m.id,
            sender_type: m.sender_type,
            sender_name: m.sender_name,
            message: m.message,
            created_at: m.created_at,
          });
        }
      }
    }

    // Buscar sugestões
    const { data: suggestions } = await supabase
      .from("portal_suggestions")
      .select("id, title, description, status, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Buscar indicações
    const { data: referrals } = await supabase
      .from("portal_referrals")
      .select("id, company_name, contact_name, phone, city, notes, status, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Montar resposta (sem dados sensíveis)
    const response = {
      client: {
        name: client.name,
        document: client.document,
        email: client.email,
        phone: client.phone,
        city: client.city,
        system_name: client.system_name,
        status: client.status,
        monthly_value_final: client.monthly_value_final,
        contract_signed_at: client.contract_signed_at,
        contract_start_at: client.contract_start_at,
        adjustment_base_date: client.adjustment_base_date,
        adjustment_type: client.adjustment_type,
        adjustment_percent: client.adjustment_percent,
        cert_expires_at: client.cert_expires_at,
        cert_issuer: client.cert_issuer,
        cert_serial: client.cert_serial,
        onboarding_completed_steps: client.onboarding_completed_steps || [],
      },
      plan: plan ? { name: plan.name, discount_percent: plan.discount_percent } : null,
      titles: titles || [],
      org_name: org?.name || "",
      modules,
      tickets: (tickets || []).map(t => ({
        ...t,
        messages: ticketMessages[t.id] || [],
      })),
      suggestions: suggestions || [],
      referrals: referrals || [],
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
