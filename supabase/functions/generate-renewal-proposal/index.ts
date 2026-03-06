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

    const body = await req.json();
    const { client_id, renewal_for_end_date, org_id: bodyOrgId, portal_token } = body;

    if (!client_id && !portal_token) {
      return new Response(JSON.stringify({ error: "client_id ou portal_token obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If using client_id (internal), require authentication
    if (client_id && !portal_token) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const authClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        anonKey,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: claimsData, error: claimsErr } = await authClient.auth.getUser();
      if (claimsErr || !claimsData?.user) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Resolve client
    let clientQuery = supabase
      .from("clients")
      .select("id, org_id, name, trade_name, system_name, plan_id, metadata, monthly_value_final, monthly_value_base, phone, email, portal_token");

    if (portal_token) {
      clientQuery = clientQuery.eq("portal_token", portal_token);
    } else {
      clientQuery = clientQuery.eq("id", client_id);
    }

    const { data: client, error: clientErr } = await clientQuery.single();
    if (clientErr || !client) {
      return new Response(JSON.stringify({ error: "Cliente não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = bodyOrgId || client.org_id;
    const clientMeta = (client as any).metadata || {};
    const endDate = renewal_for_end_date || clientMeta.plan_end_date;

    if (!endDate) {
      return new Response(JSON.stringify({ error: "Cliente não possui data de vencimento do plano" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency check
    const { data: existing } = await supabase
      .from("plan_renewal_requests")
      .select("id, generated_proposal_id, proposal_public_token, status")
      .eq("org_id", orgId)
      .eq("client_id", client.id)
      .eq("renewal_for_end_date", endDate)
      .maybeSingle();

    if (existing && existing.proposal_public_token) {
      const baseUrl = Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", "");
      return new Response(JSON.stringify({
        renewal_request_id: existing.id,
        proposal_id: existing.generated_proposal_id,
        proposal_public_token: existing.proposal_public_token,
        proposal_url: `${req.headers.get("origin") || ""}/proposta/${existing.proposal_public_token}`,
        status: existing.status,
        already_exists: true,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get company config
    const { data: company } = await supabase
      .from("company_profile")
      .select("trade_name, renewal_validity_days, renewal_template, renewal_whatsapp, renewal_email")
      .eq("org_id", orgId)
      .maybeSingle();

    const validDays = company?.renewal_validity_days || 7;

    // Get plan name
    let planName = clientMeta.billing_plan || "mensal";
    if (client.plan_id) {
      const { data: plan } = await supabase
        .from("plans")
        .select("name")
        .eq("id", client.plan_id)
        .maybeSingle();
      if (plan) planName = plan.name;
    }

    // Generate proposal number
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId);
    const seq = ((count || 0) + 1).toString().padStart(4, "0");
    const proposalNumber = `PROP-${year}-${seq}`;

    // Generate acceptance link token
    const tokenBytes = new Uint8Array(24);
    crypto.getRandomValues(tokenBytes);
    const acceptanceLink = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");

    // Calculate valid_until
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    // Create proposal
    const { data: proposal, error: proposalErr } = await supabase
      .from("proposals")
      .insert({
        org_id: orgId,
        proposal_number: proposalNumber,
        client_id: client.id,
        client_name_snapshot: client.trade_name || client.name,
        system_name: client.system_name,
        plan_name: planName,
        monthly_value: client.monthly_value_final || client.monthly_value_base || 0,
        implementation_value: 0,
        implementation_flow: "a_vista",
        valid_days: validDays,
        valid_until: validUntil.toISOString(),
        acceptance_link: acceptanceLink,
        acceptance_status: "pendente",
        view_status: "nao_enviado",
        proposal_type: "renewal",
        reference_end_date: endDate,
        notes_internal: `Proposta de renovação gerada automaticamente para vencimento ${endDate}`,
      })
      .select("id")
      .single();

    if (proposalErr || !proposal) {
      return new Response(JSON.stringify({ error: "Erro ao criar proposta", detail: proposalErr?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create or update plan_renewal_requests
    if (existing) {
      await supabase
        .from("plan_renewal_requests")
        .update({
          generated_proposal_id: proposal.id,
          proposal_public_token: acceptanceLink,
          status: "proposta_enviada",
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("plan_renewal_requests")
        .insert({
          org_id: orgId,
          client_id: client.id,
          renewal_for_end_date: endDate,
          generated_proposal_id: proposal.id,
          proposal_public_token: acceptanceLink,
          status: "proposta_enviada",
          auto_generated: true,
        });
    }

    // Build WhatsApp URL if enabled
    let whatsappUrl = null;
    if (company?.renewal_whatsapp && client.phone) {
      const phone = client.phone.replace(/\D/g, "");
      const proposalUrl = `${req.headers.get("origin") || ""}/proposta/${acceptanceLink}`;
      let template = company.renewal_template || "Olá {cliente}, segue sua proposta de renovação: {link}";
      template = template
        .replace("{cliente}", client.trade_name || client.name)
        .replace("{link}", proposalUrl)
        .replace("{plano_nome}", planName)
        .replace("{data_vencimento}", endDate)
        .replace("{nome_empresa}", company.trade_name || "");
      whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(template)}`;

      // Record whatsapp_sent_at
      await supabase
        .from("plan_renewal_requests")
        .update({ whatsapp_sent_at: new Date().toISOString() })
        .eq("org_id", orgId)
        .eq("client_id", client.id)
        .eq("renewal_for_end_date", endDate);
    }

    return new Response(JSON.stringify({
      renewal_request_id: existing?.id || null,
      proposal_id: proposal.id,
      proposal_public_token: acceptanceLink,
      proposal_url: `${req.headers.get("origin") || ""}/proposta/${acceptanceLink}`,
      whatsapp_url: whatsappUrl,
      already_exists: false,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Erro interno", detail: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
