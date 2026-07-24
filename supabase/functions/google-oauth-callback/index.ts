import { createClient } from "npm:@supabase/supabase-js@2";

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function htmlResponse(msg: string, ok: boolean, origin?: string): Response {
  const type = ok ? "google-oauth-success" : "google-oauth-error";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${ok ? "Sucesso" : "Erro"}</title>
<style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{background:#1e293b;padding:2rem 2.5rem;border-radius:12px;text-align:center;max-width:400px}
h1{margin:0 0 .5rem;font-size:1.25rem}
p{margin:.25rem 0;color:#94a3b8;font-size:.9rem}</style></head><body>
<div class="card"><h1>${ok ? "✅ Google Calendar conectado!" : "⚠️ Erro na conexão"}</h1><p>${msg}</p><p style="margin-top:1rem;font-size:.8rem">Esta janela fechará automaticamente.</p></div>
<script>
try { if (window.opener) { window.opener.postMessage({ type: "${type}", message: ${JSON.stringify(msg)} }, ${JSON.stringify(origin || "*")}); } } catch(e){}
setTimeout(() => window.close(), 1500);
</script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) return htmlResponse(`Google retornou: ${errorParam}`, false);
  if (!code || !state) return htmlResponse("Parâmetros ausentes", false);

  try {
    const [encodedPayload, sig] = state.split(".");
    if (!encodedPayload || !sig) return htmlResponse("State inválido", false);

    const secret = Deno.env.get("CRON_SECRET") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const payload = atob(encodedPayload + "=".repeat((4 - encodedPayload.length % 4) % 4));
    const expectedSig = await hmac(payload, secret);
    if (expectedSig !== sig) return htmlResponse("State assinatura inválida", false);

    const [userId, timestampStr, origin] = payload.split(".");
    const timestamp = parseInt(timestampStr, 10);
    if (Date.now() - timestamp > 10 * 60 * 1000) return htmlResponse("State expirado", false, origin);

    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
    if (!clientId || !clientSecret) return htmlResponse("Credenciais do Google não configuradas no servidor", false, origin);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Google token exchange failed:", errText);
      return htmlResponse("Falha ao trocar código por token", false, origin);
    }

    const tokens = await tokenRes.json();

    // Get user email
    let googleEmail: string | null = null;
    try {
      const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (infoRes.ok) {
        const info = await infoRes.json();
        googleEmail = info.email || null;
      }
    } catch {}

    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: upsertErr } = await supabase
      .from("google_calendar_tokens")
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token, // present because access_type=offline + prompt=consent
        expires_at: expiresAt,
        scope: tokens.scope,
        google_email: googleEmail,
      }, { onConflict: "user_id" });

    if (upsertErr) {
      console.error("Failed to save tokens:", upsertErr);
      return htmlResponse("Falha ao salvar credenciais", false, origin);
    }

    return htmlResponse(googleEmail ? `Conta ${googleEmail} conectada.` : "Conta conectada.", true, origin);
  } catch (err) {
    console.error("google-oauth-callback error:", err);
    return htmlResponse((err as Error).message, false);
  }
});
