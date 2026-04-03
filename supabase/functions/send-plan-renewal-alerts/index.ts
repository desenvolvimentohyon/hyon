import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Auth: accept x-cron-secret OR the anon key in Authorization ──
function isCronAuthorized(req: Request): boolean {
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret && cronSecret === Deno.env.get("CRON_SECRET")) return true;

  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (anonKey && token === anonKey) return true;
  }

  const apiKey = req.headers.get("apikey");
  if (apiKey) {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (anonKey && apiKey === anonKey) return true;
  }

  return false;
}

// ── Minimal web-push helpers ──
function base64urlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (b64.length % 4)) % 4;
  const padded = b64 + "=".repeat(pad);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const total = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) { result.set(b, offset); offset += b.length; }
  return result;
}

function createPkcs8FromRaw(rawKey: Uint8Array): ArrayBuffer {
  const prefix = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const result = new Uint8Array(prefix.length + rawKey.length);
  result.set(prefix);
  result.set(rawKey, prefix.length);
  return result.buffer;
}

function derToRaw(der: Uint8Array): Uint8Array {
  const raw = new Uint8Array(64);
  let offset = 2;
  offset += 1;
  const rLen = der[offset++];
  const rStart = offset + (rLen > 32 ? rLen - 32 : 0);
  raw.set(der.slice(rStart, offset + rLen), 32 - Math.min(rLen, 32));
  offset += rLen;
  offset += 1;
  const sLen = der[offset++];
  const sStart = offset + (sLen > 32 ? sLen - 32 : 0);
  raw.set(der.slice(sStart, offset + sLen), 64 - Math.min(sLen, 32));
  return raw;
}

async function createVapidJwt(audience: string, subject: string, privateKeyBytes: Uint8Array): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 86400, sub: subject };
  const headerB64 = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d: uint8ArrayToBase64url(privateKeyBytes), x: "", y: "" },
    { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
  ).catch(async () => {
    const pkcs8 = createPkcs8FromRaw(privateKeyBytes);
    return crypto.subtle.importKey("pkcs8", pkcs8, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  });

  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsignedToken));
  const sigBytes = new Uint8Array(signature);
  const rawSig = sigBytes.length === 64 ? sigBytes : derToRaw(sigBytes);
  return `${unsignedToken}.${uint8ArrayToBase64url(rawSig)}`;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, salt.length ? salt : new Uint8Array(32)));
  const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const infoWithCounter = concatBuffers(info, new Uint8Array([1]));
  const derived = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, infoWithCounter));
  return derived.slice(0, length);
}

async function encryptPayload(p256dhKey: string, authSecret: string, payload: Uint8Array): Promise<ArrayBuffer> {
  const clientPublicKey = base64urlToUint8Array(p256dhKey);
  const clientAuth = base64urlToUint8Array(authSecret);
  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPublicKey = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));
  const clientKey = await crypto.subtle.importKey("raw", clientPublicKey, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, localKeyPair.privateKey, 256));
  const authInfo = concatBuffers(new TextEncoder().encode("WebPush: info\0"), clientPublicKey, localPublicKey);
  const ikm = await hkdf(clientAuth, sharedSecret, authInfo, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const contentKey = await hkdf(salt, ikm, new TextEncoder().encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, new TextEncoder().encode("Content-Encoding: nonce\0"), 12);
  const paddedPayload = concatBuffers(payload, new Uint8Array([2]));
  const aesKey = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"]);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPayload));
  const rs = new ArrayBuffer(4);
  new DataView(rs).setUint32(0, 4096);
  const header = concatBuffers(salt, new Uint8Array(rs), new Uint8Array([65]), localPublicKey);
  return concatBuffers(header, encrypted).buffer;
}

async function sendWebPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string, vapidPublicKey: string, vapidPrivateKey: string) {
  const privateKeyBytes = base64urlToUint8Array(vapidPrivateKey);
  const publicKeyBytes = base64urlToUint8Array(vapidPublicKey);
  const audience = new URL(subscription.endpoint).origin;
  const jwt = await createVapidJwt(audience, "mailto:push@hyon.com.br", privateKeyBytes);
  const encrypted = await encryptPayload(subscription.keys.p256dh, subscription.keys.auth, new TextEncoder().encode(payload));

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "Content-Length": String(encrypted.byteLength),
      TTL: "86400",
      Authorization: `vapid t=${jwt}, k=${uint8ArrayToBase64url(publicKeyBytes)}`,
    },
    body: encrypted,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Push failed: ${response.status} ${text}`);
  }
  await response.text();
}

async function sendPushToOrg(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  title: string,
  body: string,
  url: string
) {
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!vapidPublicKey || !vapidPrivateKey) return 0;

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("org_id", orgId)
    .eq("is_active", true);

  if (!subs || subs.length === 0) return 0;

  const payload = JSON.stringify({ title, body, icon: "/pwa-192x192.png", url });
  let sent = 0;

  for (const sub of subs) {
    try {
      await sendWebPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload, vapidPublicKey, vapidPrivateKey
      );
      sent++;
    } catch (err) {
      console.error("Push failed for sub:", sub.id, err);
      if ((err as Error).message?.includes("410")) {
        await supabase.from("push_subscriptions").update({ is_active: false }).eq("id", sub.id);
      }
    }
  }
  return sent;
}

// ── Main handler ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!isCronAuthorized(req)) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Fetch all orgs with alerts enabled
    const { data: companies, error: compErr } = await supabase
      .from("company_profile")
      .select("org_id, trade_name, renewal_alert_enabled, renewal_alert_days, renewal_whatsapp, renewal_email, renewal_whatsapp_template, renewal_email_template, renewal_template")
      .eq("renewal_alert_enabled", true);

    if (compErr) throw compErr;
    if (!companies || companies.length === 0) {
      return new Response(JSON.stringify({ message: "No orgs with alerts enabled", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const defaultWhatsappTemplate = `Olá, {cliente_nome} 👋\nSeu plano {plano_nome} vence em {dias_restantes} dias (vencimento: {data_vencimento}).\n\nPara renovar de forma rápida, acesse:\n{link_renovacao}\n\nQualquer dúvida, me chame por aqui.\n{nome_empresa}`;
    const defaultEmailTemplate = `Olá {cliente_nome},\nSeu plano {plano_nome} vence em {dias_restantes} dias (vencimento: {data_vencimento}).\nPara solicitar a renovação, acesse: {link_renovacao}\n\nAtenciosamente,\n{nome_empresa}`;

    let totalSent = 0;
    let totalPushSent = 0;
    const results: any[] = [];

    for (const company of companies) {
      const alertDays = company.renewal_alert_days || 7;
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + alertDays);
      const futureDateStr = futureDate.toISOString().slice(0, 10);

      const { data: clients, error: clientErr } = await supabase
        .from("clients")
        .select("id, name, trade_name, phone, email, metadata, monthly_value_final, portal_token, primary_contact_phone, primary_contact_email, billing_phone, billing_email")
        .eq("org_id", company.org_id)
        .eq("status", "ativo");

      if (clientErr || !clients || clients.length === 0) continue;

      const eligibleClients = clients.filter((c: any) => {
        const meta = c.metadata || {};
        const planEndDate = meta.plan_end_date;
        const billingPlan = meta.billing_plan;
        if (!planEndDate) return false;
        if (!["trimestral", "semestral", "anual"].includes(billingPlan)) return false;
        return planEndDate >= todayStr && planEndDate <= futureDateStr;
      });

      if (eligibleClients.length === 0) continue;

      const clientIds = eligibleClients.map((c: any) => c.id);
      const { data: existingLogs } = await supabase
        .from("notification_logs")
        .select("client_id, channel, plan_end_date")
        .eq("org_id", company.org_id)
        .eq("type", "plan_renewal")
        .in("client_id", clientIds);

      const logSet = new Set(
        (existingLogs || []).map((l: any) => `${l.client_id}|${l.channel}|${l.plan_end_date}`)
      );

      const whatsappTemplate = company.renewal_whatsapp_template || defaultWhatsappTemplate;
      const emailTemplate = company.renewal_email_template || defaultEmailTemplate;
      const origin = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "") || "";

      for (const client of eligibleClients) {
        const meta = (client as any).metadata || {};
        const endDate = meta.plan_end_date;
        const billingPlan = meta.billing_plan;
        const end = new Date(endDate + "T00:00:00");
        const nowDate = new Date(todayStr + "T00:00:00");
        const daysLeft = Math.ceil((end.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));

        const renewalLink = (client as any).portal_token
          ? `${origin}/renovar/${(client as any).portal_token}`
          : "";

        const clientName = (client as any).trade_name || (client as any).name;
        const planName = billingPlan || "mensal";
        const formattedDate = end.toLocaleDateString("pt-BR");

        const replaceVars = (template: string) =>
          template
            .replace(/{cliente_nome}/g, clientName)
            .replace(/{plano_nome}/g, planName)
            .replace(/{data_vencimento}/g, formattedDate)
            .replace(/{dias_restantes}/g, String(daysLeft))
            .replace(/{valor_mensalidade}/g, ((client as any).monthly_value_final || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))
            .replace(/{link_renovacao}/g, renewalLink)
            .replace(/{nome_empresa}/g, company.trade_name || "");

        let notifiedThisClient = false;

        // WhatsApp
        if (company.renewal_whatsapp) {
          const key = `${(client as any).id}|whatsapp|${endDate}`;
          if (!logSet.has(key)) {
            const phone = ((client as any).billing_phone || (client as any).primary_contact_phone || (client as any).phone || "").replace(/\D/g, "");
            const message = replaceVars(whatsappTemplate);
            const whatsappUrl = phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(message)}` : null;

            await supabase.from("notification_logs").insert({
              org_id: company.org_id,
              client_id: (client as any).id,
              type: "plan_renewal",
              channel: "whatsapp",
              target: phone || null,
              plan_end_date: endDate,
              status: "sent",
            });

            totalSent++;
            notifiedThisClient = true;
            results.push({ client: clientName, channel: "whatsapp", whatsapp_url: whatsappUrl });
          }
        }

        // Email
        if (company.renewal_email) {
          const key = `${(client as any).id}|email|${endDate}`;
          if (!logSet.has(key)) {
            const email = (client as any).billing_email || (client as any).primary_contact_email || (client as any).email || "";

            await supabase.from("notification_logs").insert({
              org_id: company.org_id,
              client_id: (client as any).id,
              type: "plan_renewal",
              channel: "email",
              target: email || null,
              plan_end_date: endDate,
              status: "sent",
            });

            totalSent++;
            notifiedThisClient = true;
            results.push({ client: clientName, channel: "email", target: email });
          }
        }

        // Send push notification for this client's renewal alert
        if (notifiedThisClient) {
          try {
            const pushed = await sendPushToOrg(
              supabase,
              company.org_id,
              "📆 Plano vencendo",
              `${clientName} - plano ${planName} vence em ${daysLeft} dia(s)`,
              "/receita"
            );
            totalPushSent += pushed;
          } catch (e) {
            console.error("Push send error in renewal-alerts:", e);
          }
        }
      }
    }

    return new Response(JSON.stringify({ sent: totalSent, pushSent: totalPushSent, details: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-plan-renewal-alerts error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
