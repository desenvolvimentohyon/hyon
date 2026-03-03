import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get user's org
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "No profile" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const orgId = profile.org_id;

    // Check if already seeded (check if plans exist)
    const { data: existingPlans } = await supabase
      .from("plans")
      .select("id")
      .eq("org_id", orgId)
      .limit(1);

    if (existingPlans && existingPlans.length > 0) {
      return new Response(JSON.stringify({ message: "Already seeded" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Seed plans
    await supabase.from("plans").insert([
      { org_id: orgId, name: "Mensal", months_validity: 1, discount_percent: 0, active: true },
      { org_id: orgId, name: "Trimestral", months_validity: 3, discount_percent: 5, active: true },
      { org_id: orgId, name: "Semestral", months_validity: 6, discount_percent: 10, active: true },
      { org_id: orgId, name: "Anual", months_validity: 12, discount_percent: 15, active: true },
    ]);

    // Seed payment methods
    await supabase.from("payment_methods").insert([
      { org_id: orgId, name: "Pix", active: true },
      { org_id: orgId, name: "Boleto", active: true },
      { org_id: orgId, name: "Cartão de Crédito", active: true },
      { org_id: orgId, name: "Transferência", active: true },
      { org_id: orgId, name: "Dinheiro", active: true },
    ]);

    // Seed CRM statuses
    await supabase.from("crm_statuses").insert([
      { org_id: orgId, name: "Rascunho", sort_order: 0, is_default: true },
      { org_id: orgId, name: "Enviada", sort_order: 1 },
      { org_id: orgId, name: "Visualizada", sort_order: 2 },
      { org_id: orgId, name: "Negociação", sort_order: 3 },
      { org_id: orgId, name: "Aceita", sort_order: 4 },
      { org_id: orgId, name: "Recusada", sort_order: 5 },
    ]);

    // Seed systems catalog
    await supabase.from("systems_catalog").insert([
      { org_id: orgId, name: "Hyon Alimentação", description: "Sistema para restaurantes e alimentação", cost_value: 50, sale_value: 199, active: true },
      { org_id: orgId, name: "LinkPro Varejo", description: "Sistema para varejo e comércio", cost_value: 80, sale_value: 299, active: true },
    ]);

    // Seed proposal settings
    await supabase.from("proposal_settings").insert({
      org_id: orgId,
      default_valid_days: 15,
      default_send_method: "whatsapp",
      company_name: "Minha Empresa",
      alert_days_before_expiry: 30,
    });

    return new Response(JSON.stringify({ message: "Seed completed" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
