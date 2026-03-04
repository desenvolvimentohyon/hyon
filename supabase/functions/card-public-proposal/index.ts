import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const action = url.searchParams.get("action") || "view";

  if (!token) {
    return new Response(JSON.stringify({ error: "Token required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Fetch proposal by public_token
    const { data: proposal, error: pErr } = await supabase
      .from("card_proposals")
      .select("*, card_clients(*)")
      .eq("public_token", token)
      .maybeSingle();

    if (pErr || !proposal) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch company profile
    const { data: company } = await supabase
      .from("company_profile")
      .select("trade_name, legal_name, logo_path, primary_color, secondary_color, phone, whatsapp, email, website, cnpj, footer_text, institutional_text")
      .eq("org_id", proposal.org_id)
      .maybeSingle();

    // Fetch active fee profile
    const { data: feeProfile } = await supabase
      .from("card_fee_profiles")
      .select("*")
      .eq("card_client_id", proposal.card_client_id)
      .eq("active", true)
      .maybeSingle();

    if (req.method === "GET" || action === "view") {
      // Track view
      if (!proposal.first_viewed_at && proposal.status === "enviada") {
        await supabase
          .from("card_proposals")
          .update({ first_viewed_at: new Date().toISOString(), status: "visualizada" })
          .eq("id", proposal.id);
      }

      return new Response(
        JSON.stringify({
          proposal: {
            id: proposal.id,
            title: proposal.title,
            machine_type: proposal.machine_type,
            commission_percent: proposal.commission_percent,
            fee_profile_snapshot: proposal.fee_profile_snapshot,
            validity_days: proposal.validity_days,
            status: proposal.status,
            sent_at: proposal.sent_at,
            first_viewed_at: proposal.first_viewed_at,
            accepted_at: proposal.accepted_at,
            accepted_by_name: proposal.accepted_by_name,
            created_at: proposal.created_at,
          },
          client: {
            name: proposal.card_clients?.name,
            company_name: proposal.card_clients?.company_name,
          },
          company,
          feeProfile,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (action === "accept") {
        await supabase
          .from("card_proposals")
          .update({
            status: "aceita",
            accepted_at: new Date().toISOString(),
            accepted_by_name: body.name || null,
          })
          .eq("id", proposal.id);

        // Create onboarding record
        await supabase.from("card_proposal_onboarding").insert({
          org_id: proposal.org_id,
          card_proposal_id: proposal.id,
          card_client_id: proposal.card_client_id,
          status: "solicitado",
        });

        // Update client status
        await supabase
          .from("card_clients")
          .update({ status: "ativo" })
          .eq("id", proposal.card_client_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "refuse") {
        await supabase
          .from("card_proposals")
          .update({ status: "recusada", refused_at: new Date().toISOString() })
          .eq("id", proposal.id);

        await supabase
          .from("card_clients")
          .update({ status: "recusado" })
          .eq("id", proposal.card_client_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "onboarding") {
        await supabase
          .from("card_proposal_onboarding")
          .update({
            status: "recebido",
            data_payload: body.data || {},
            completed_at: new Date().toISOString(),
          })
          .eq("card_proposal_id", proposal.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
