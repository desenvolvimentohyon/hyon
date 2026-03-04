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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const action = url.searchParams.get("action"); // "view" | "accept" | "track"

  if (!token) {
    return new Response(JSON.stringify({ error: "Token obrigatório" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (req.method === "GET" || action === "view") {
      // Fetch proposal by acceptance_link token
      const { data: proposal, error } = await supabase
        .from("proposals")
        .select(
          "id, proposal_number, client_name_snapshot, system_name, plan_name, monthly_value, implementation_value, implementation_flow, implementation_installments, valid_days, valid_until, acceptance_status, view_status, additional_info, notes_internal, first_viewed_at, views_count, accepted_at, accepted_by_name, created_at, sent_at"
        )
        .eq("acceptance_link", token)
        .single();

      if (error || !proposal) {
        return new Response(
          JSON.stringify({ error: "Proposta não encontrada" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Track view
      const updates: Record<string, unknown> = {
        views_count: (proposal.views_count || 0) + 1,
      };
      if (!proposal.first_viewed_at) {
        updates.first_viewed_at = new Date().toISOString();
      }
      if (proposal.view_status === "nao_enviado" || proposal.view_status === "enviado") {
        updates.view_status = "visualizado";
      }

      await supabase
        .from("proposals")
        .update(updates)
        .eq("id", proposal.id);

      // Fetch proposal items
      const { data: items } = await supabase
        .from("proposal_items")
        .select("id, description, quantity, unit_value")
        .eq("proposal_id", proposal.id)
        .order("created_at", { ascending: true });

      // Fetch company profile for branding
      const { data: proposals_with_org } = await supabase
        .from("proposals")
        .select("org_id")
        .eq("id", proposal.id)
        .single();

      let company = null;
      if (proposals_with_org?.org_id) {
        const { data: cp } = await supabase
          .from("company_profile")
          .select(
            "trade_name, legal_name, logo_path, primary_color, secondary_color, footer_text, phone, whatsapp, email, website, cnpj, address_street, address_number, address_neighborhood, address_city, address_uf, address_cep, institutional_text"
          )
          .eq("org_id", proposals_with_org.org_id)
          .single();
        company = cp;
      }

      return new Response(
        JSON.stringify({ proposal: { ...proposal }, items: items || [], company }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();

      // Find proposal
      const { data: proposal, error } = await supabase
        .from("proposals")
        .select("id, acceptance_status")
        .eq("acceptance_link", token)
        .single();

      if (error || !proposal) {
        return new Response(
          JSON.stringify({ error: "Proposta não encontrada" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (action === "accept") {
        if (proposal.acceptance_status === "aceitou") {
          return new Response(
            JSON.stringify({ error: "Proposta já aceita" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        await supabase
          .from("proposals")
          .update({
            acceptance_status: "aceitou",
            view_status: "visualizado",
            crm_status: "Aceita",
            accepted_at: new Date().toISOString(),
            accepted_by_name: body.name || null,
          })
          .eq("id", proposal.id);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "reject") {
        await supabase
          .from("proposals")
          .update({
            acceptance_status: "recusou",
            crm_status: "Recusada",
          })
          .eq("id", proposal.id);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "track") {
        const field = body.field; // "pdf_downloaded_at" | "whatsapp_clicked_at"
        if (
          field === "pdf_downloaded_at" ||
          field === "whatsapp_clicked_at"
        ) {
          await supabase
            .from("proposals")
            .update({ [field]: new Date().toISOString() })
            .eq("id", proposal.id);
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
