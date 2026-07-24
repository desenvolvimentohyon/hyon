// Cron: envia lembretes push de reuniões (1 dia, 1 hora, 15 min antes).
// Autenticação: header x-cron-secret == CRON_SECRET.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    if (!cronSecret || provided !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    webpush.setVapidDetails("mailto:push@hyon.com.br", vapidPublicKey, vapidPrivateKey);

    const supabase = createClient(supabaseUrl, serviceKey);
    const now = Date.now();

    // Janela: buscar reuniões que começam nas próximas 25 horas, agendadas e não concluídas
    const upperBound = new Date(now + 25 * 60 * 60 * 1000).toISOString();
    const lowerBound = new Date(now - 5 * 60 * 1000).toISOString(); // 5min tolerance for "no início"

    const { data: meetings, error } = await supabase
      .from("meetings")
      .select("id, org_id, title, starts_at, meeting_link, location, created_by, internal_user_ids, reminded_1d, reminded_1h, reminded_15m")
      .eq("status", "agendada")
      .gte("starts_at", lowerBound)
      .lte("starts_at", upperBound);

    if (error) throw error;

    const results: Array<{ meeting: string; window: string; sent: number }> = [];

    for (const m of meetings || []) {
      const startTs = new Date(m.starts_at).getTime();
      const diffMin = Math.round((startTs - now) / 60000);

      const windows: Array<{ key: "1d" | "1h" | "15m"; label: string; column: "reminded_1d" | "reminded_1h" | "reminded_15m"; match: boolean }> = [
        { key: "1d", label: "amanhã", column: "reminded_1d", match: diffMin >= 1380 && diffMin <= 1500 && !m.reminded_1d },
        { key: "1h", label: "em 1 hora", column: "reminded_1h", match: diffMin >= 55 && diffMin <= 65 && !m.reminded_1h },
        { key: "15m", label: "em 15 minutos", column: "reminded_15m", match: diffMin >= 10 && diffMin <= 20 && !m.reminded_15m },
      ];

      for (const w of windows) {
        if (!w.match) continue;

        // Destinatários: criador + participantes internos
        const userIds = Array.from(new Set([m.created_by, ...(m.internal_user_ids || [])].filter(Boolean)));
        if (userIds.length === 0) continue;

        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth")
          .in("user_id", userIds)
          .eq("org_id", m.org_id)
          .eq("is_active", true);

        const timeStr = new Date(m.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
        const payload = JSON.stringify({
          title: `📅 Reunião ${w.label}`,
          body: `${m.title} — ${timeStr}${m.location ? ` • ${m.location}` : ""}`,
          icon: "/pwa-192x192.png",
          url: `/reunioes?id=${m.id}`,
          tag: `meeting-${m.id}-${w.key}`,
        });

        let sent = 0;
        for (const sub of subs || []) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
            );
            sent++;
          } catch (err: unknown) {
            const e = err as { statusCode?: number; message?: string };
            if (e.statusCode === 404 || e.statusCode === 410) {
              await supabase.from("push_subscriptions").update({ is_active: false }).eq("id", sub.id);
            } else {
              console.error("Push error:", e.message);
            }
          }
        }

        await supabase.from("meetings").update({ [w.column]: true }).eq("id", m.id);
        results.push({ meeting: m.id, window: w.key, sent });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("meetings-reminder-cron error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
