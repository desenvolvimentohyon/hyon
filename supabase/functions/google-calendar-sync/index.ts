import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    console.error("Refresh failed:", await res.text());
    return null;
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: claims } = await supabaseUser.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json();
    const action = body.action as "status" | "disconnect" | "create-event" | undefined;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // === STATUS ===
    if (action === "status") {
      const { data } = await supabase
        .from("google_calendar_tokens")
        .select("google_email, expires_at")
        .eq("user_id", userId)
        .maybeSingle();
      return new Response(JSON.stringify({ connected: !!data, google_email: data?.google_email || null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === DISCONNECT ===
    if (action === "disconnect") {
      await supabase.from("google_calendar_tokens").delete().eq("user_id", userId);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === CREATE EVENT ===
    if (action === "create-event") {
      const meetingId = body.meeting_id as string;
      if (!meetingId) {
        return new Response(JSON.stringify({ error: "meeting_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Load meeting (owner check via user access — meeting must be visible to this user)
      const { data: meeting, error: mErr } = await supabaseUser
        .from("meetings")
        .select("*")
        .eq("id", meetingId)
        .maybeSingle();

      if (mErr || !meeting) {
        return new Response(JSON.stringify({ error: "Meeting not found or access denied" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Load tokens
      const { data: tokenRow } = await supabase
        .from("google_calendar_tokens")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!tokenRow) {
        return new Response(JSON.stringify({ error: "not_connected" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let accessToken = tokenRow.access_token;
      if (new Date(tokenRow.expires_at).getTime() - Date.now() < 60_000) {
        const refreshed = await refreshAccessToken(tokenRow.refresh_token);
        if (!refreshed?.access_token) {
          return new Response(JSON.stringify({ error: "refresh_failed" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        accessToken = refreshed.access_token;
        await supabase.from("google_calendar_tokens").update({
          access_token: refreshed.access_token,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        }).eq("user_id", userId);
      }

      // Build attendees: external guests with email + internal user emails
      const attendees: { email: string; displayName?: string }[] = [];
      const externalGuests = (meeting.external_guests || []) as { name?: string; email?: string }[];
      for (const g of externalGuests) {
        if (g.email) attendees.push({ email: g.email, displayName: g.name });
      }

      const internalIds = (meeting.internal_user_ids || []) as string[];
      if (internalIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", internalIds);
        for (const p of profiles || []) {
          if (p.email) attendees.push({ email: p.email, displayName: p.full_name || undefined });
        }
      }

      const description = [
        meeting.description || "",
        meeting.meeting_link ? `\nLink da reunião: ${meeting.meeting_link}` : "",
      ].join("").trim();

      const eventPayload: Record<string, unknown> = {
        summary: meeting.title,
        description: description || undefined,
        location: meeting.location || undefined,
        start: { dateTime: new Date(meeting.starts_at).toISOString() },
        end: { dateTime: new Date(meeting.ends_at).toISOString() },
        attendees,
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 60 },
            { method: "popup", minutes: 15 },
          ],
        },
      };

      const isUpdate = !!meeting.google_event_id;
      const url = isUpdate
        ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${meeting.google_event_id}?sendUpdates=all`
        : `https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all`;

      const gRes = await fetch(url, {
        method: isUpdate ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      });

      if (!gRes.ok) {
        const errText = await gRes.text();
        console.error(`Google API [${gRes.status}]: ${errText}`);
        return new Response(JSON.stringify({ error: "google_api_error", status: gRes.status, details: errText }), { status: gRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const event = await gRes.json();

      // Save google_event_id on meeting (as service role, since meeting RLS is strict)
      await supabase.from("meetings").update({ google_event_id: event.id }).eq("id", meetingId);

      return new Response(JSON.stringify({ ok: true, event_id: event.id, html_link: event.htmlLink }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("google-calendar-sync error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
