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

    // Validate token → get client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, org_id, name")
      .eq("portal_token", token)
      .single();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "action obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: unknown = null;

    switch (action) {
      case "create_ticket": {
        const { title, description } = body;
        if (!title || typeof title !== "string" || title.trim().length === 0) {
          return new Response(JSON.stringify({ error: "title obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data, error } = await supabase.from("portal_tickets").insert({
          org_id: client.org_id,
          client_id: client.id,
          title: title.trim().slice(0, 200),
          description: (description || "").trim().slice(0, 2000),
        }).select().single();
        if (error) throw error;
        // Also add first message if description provided
        if (description && description.trim()) {
          await supabase.from("portal_ticket_messages").insert({
            ticket_id: data.id,
            org_id: client.org_id,
            sender_type: "client",
            sender_name: client.name,
            message: description.trim().slice(0, 2000),
          });
        }
        result = data;
        break;
      }

      case "add_ticket_message": {
        const { ticket_id, message } = body;
        if (!ticket_id || !message || typeof message !== "string" || message.trim().length === 0) {
          return new Response(JSON.stringify({ error: "ticket_id e message obrigatórios" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Verify ticket belongs to this client
        const { data: ticket } = await supabase.from("portal_tickets")
          .select("id").eq("id", ticket_id).eq("client_id", client.id).single();
        if (!ticket) {
          return new Response(JSON.stringify({ error: "Ticket não encontrado" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data, error } = await supabase.from("portal_ticket_messages").insert({
          ticket_id,
          org_id: client.org_id,
          sender_type: "client",
          sender_name: client.name,
          message: message.trim().slice(0, 2000),
        }).select().single();
        if (error) throw error;
        result = data;
        break;
      }

      case "create_suggestion": {
        const { title, description } = body;
        if (!title || typeof title !== "string" || title.trim().length === 0) {
          return new Response(JSON.stringify({ error: "title obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data, error } = await supabase.from("portal_suggestions").insert({
          org_id: client.org_id,
          client_id: client.id,
          title: title.trim().slice(0, 200),
          description: (description || "").trim().slice(0, 2000),
        }).select().single();
        if (error) throw error;
        result = data;
        break;
      }

      case "create_referral": {
        const { company_name, contact_name, phone, city, notes } = body;
        if (!company_name || typeof company_name !== "string" || company_name.trim().length === 0) {
          return new Response(JSON.stringify({ error: "company_name obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data, error } = await supabase.from("portal_referrals").insert({
          org_id: client.org_id,
          client_id: client.id,
          company_name: company_name.trim().slice(0, 200),
          contact_name: (contact_name || "").trim().slice(0, 200),
          phone: (phone || "").trim().slice(0, 30),
          city: (city || "").trim().slice(0, 100),
          notes: (notes || "").trim().slice(0, 1000),
        }).select().single();
        if (error) throw error;
        result = data;
        break;
      }

      case "update_profile": {
        const { email, phone } = body;
        const updates: Record<string, string> = {};
        if (email && typeof email === "string") updates.email = email.trim().slice(0, 200);
        if (phone && typeof phone === "string") updates.phone = phone.trim().slice(0, 30);
        if (Object.keys(updates).length === 0) {
          return new Response(JSON.stringify({ error: "email ou phone obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error } = await supabase.from("clients").update(updates).eq("id", client.id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "complete_onboarding_step": {
        const { step } = body;
        if (!step || typeof step !== "string") {
          return new Response(JSON.stringify({ error: "step obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Get current steps and append
        const { data: currentClient } = await supabase.from("clients")
          .select("onboarding_completed_steps").eq("id", client.id).single();
        const currentSteps: string[] = currentClient?.onboarding_completed_steps || [];
        if (!currentSteps.includes(step)) {
          currentSteps.push(step);
          await supabase.from("clients").update({ onboarding_completed_steps: currentSteps }).eq("id", client.id);
        }
        result = { steps: currentSteps };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `action desconhecida: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("portal-action error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
