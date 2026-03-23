import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    // Get ticket by tracking_token
    const { data: ticket, error: ticketErr } = await supabase
      .from("portal_tickets")
      .select("id, title, description, status, protocol_number, created_at, updated_at, client_id, linked_task_id")
      .eq("tracking_token", token)
      .single();

    if (ticketErr || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get client name (no sensitive data)
    const { data: client } = await supabase
      .from("clients")
      .select("name")
      .eq("id", ticket.client_id)
      .single();

    // Get linked task data (checklist, status, time)
    let taskData = null;
    if (ticket.linked_task_id) {
      const { data: task } = await supabase
        .from("tasks")
        .select("id, title, status, checklist, total_time_seconds, timer_running, timer_started_at")
        .eq("id", ticket.linked_task_id)
        .single();

      if (task) {
        const checklist = Array.isArray(task.checklist) ? task.checklist : [];
        const total = checklist.length;
        const done = checklist.filter((c: any) => c.concluido || c.done).length;
        taskData = {
          status: task.status,
          checklist: checklist.map((c: any) => ({
            texto: c.texto || c.text || "",
            concluido: c.concluido || c.done || false,
          })),
          checklistTotal: total,
          checklistDone: done,
          progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
          totalTimeSeconds: task.total_time_seconds || 0,
        };
      }
    }

    // Get messages
    const { data: msgs } = await supabase
      .from("portal_ticket_messages")
      .select("sender_type, sender_name, message, created_at")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });

    const response = {
      protocol: ticket.protocol_number,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      clientName: client?.name || "Cliente",
      task: taskData,
      messages: (msgs || []).map((m: any) => ({
        senderType: m.sender_type,
        senderName: m.sender_name,
        message: m.message,
        createdAt: m.created_at,
      })),
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
