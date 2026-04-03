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
    if (token === Deno.env.get("SUPABASE_ANON_KEY")) return true;
  }
  return false;
}

// ── Minimal web-push helpers (same as push-notifications) ──
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

// ── Send push to all active subscriptions for an org ──
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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!isCronAuthorized(req)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    const { data: orgs } = await supabase.from("organizations").select("id");
    if (!orgs) return new Response(JSON.stringify({ ok: true, processed: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let totalProcessed = 0;
    let totalNotifications = 0;
    let totalTasks = 0;
    let totalRecurCommissions = 0;
    let totalPushSent = 0;

    for (const org of orgs) {
      const { data: rules } = await supabase
        .from("billing_rules")
        .select("*")
        .eq("org_id", org.id)
        .single();

      const daysBefore = rules?.days_before || [5];
      const onDueDay = rules?.on_due_day ?? true;
      const daysAfter = rules?.days_after || [3, 7, 15];
      const autoTask = rules?.auto_task ?? true;

      const { data: titles } = await supabase
        .from("financial_titles")
        .select("id, client_id, due_at, status, org_id, description, value_final, competency")
        .eq("org_id", org.id)
        .eq("type", "receber")
        .in("status", ["aberto", "vencido"])
        .not("due_at", "is", null)
        .not("client_id", "is", null);

      if (!titles || titles.length === 0) continue;

      // Pre-fetch client names for push notifications
      const clientIds = [...new Set(titles.map(t => t.client_id).filter(Boolean))];
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name, trade_name")
        .in("id", clientIds);
      const clientMap = new Map((clientsData || []).map(c => [c.id, c.trade_name || c.name]));

      for (const title of titles) {
        const dueDate = new Date(title.due_at!);
        const todayDate = new Date(today);
        const diffDays = Math.round((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

        let notificationType: string | null = null;

        if (diffDays > 0 && daysBefore.includes(diffDays)) {
          notificationType = `pre_vencimento_${diffDays}d`;
        } else if (diffDays === 0 && onDueDay) {
          notificationType = "vencimento_hoje";
        } else if (diffDays < 0) {
          const daysLate = Math.abs(diffDays);
          if (daysAfter.includes(daysLate)) {
            notificationType = `atraso_${daysLate}d`;
          }

          if (title.status === "aberto") {
            await supabase
              .from("financial_titles")
              .update({ status: "vencido" })
              .eq("id", title.id);
          }

          if (autoTask && daysLate >= 7 && daysLate % 7 === 0) {
            const { data: existingTasks } = await supabase
              .from("tasks")
              .select("id")
              .eq("org_id", org.id)
              .eq("client_id", title.client_id)
              .contains("tags", ["cobranca_auto"])
              .eq("status", "a_fazer")
              .limit(1);

            if (!existingTasks || existingTasks.length === 0) {
              await supabase.from("tasks").insert({
                org_id: org.id,
                client_id: title.client_id,
                title: `Cobrança manual - ${title.description}`,
                description: `Título com ${daysLate} dias de atraso. Realizar contato de cobrança.`,
                tipo_operacional: "financeiro",
                priority: daysLate >= 15 ? "alta" : "media",
                tags: ["cobranca_auto"],
              });
              totalTasks++;
            }
          }
        }

        // Create notification + send push if type determined
        if (notificationType) {
          const { data: existing } = await supabase
            .from("billing_notifications")
            .select("id")
            .eq("title_id", title.id)
            .eq("type", notificationType)
            .gte("sent_at", today)
            .limit(1);

          if (!existing || existing.length === 0) {
            await supabase.from("billing_notifications").insert({
              org_id: org.id,
              client_id: title.client_id,
              title_id: title.id,
              type: notificationType,
              channel: "interno",
            });
            totalNotifications++;

            // Send push notification
            const clientName = clientMap.get(title.client_id) || title.description;
            const valor = (title.value_final || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            const pushTitle = diffDays >= 0
              ? "📋 Mensalidade vencendo"
              : "🚨 Mensalidade em atraso";
            const pushBody = diffDays === 0
              ? `${clientName} - ${valor} vence hoje`
              : diffDays > 0
                ? `${clientName} - ${valor} vence em ${diffDays} dia(s)`
                : `${clientName} - ${valor} com ${Math.abs(diffDays)} dia(s) de atraso`;

            try {
              const pushed = await sendPushToOrg(supabase, org.id, pushTitle, pushBody, "/financeiro/contas-a-receber");
              totalPushSent += pushed;
            } catch (e) {
              console.error("Push send error in billing-cron:", e);
            }
          }
        }

        // === Recurring commission on_invoice_created ===
        if (title.competency && title.client_id && title.status === "aberto") {
          try {
            const { data: client } = await supabase.from("clients")
              .select("ref_partner_id, ref_partner_start_at, ref_partner_recur_percent, ref_partner_recur_months, ref_partner_recur_apply_on, status")
              .eq("id", title.client_id)
              .single();

            if (client?.ref_partner_id && client.ref_partner_recur_apply_on === "on_invoice_created" && client.ref_partner_recur_percent && client.ref_partner_recur_percent > 0 && client.status !== "cancelado") {
              let eligible = true;
              if (client.ref_partner_recur_months && client.ref_partner_recur_months > 0 && client.ref_partner_start_at) {
                const startDate = new Date(client.ref_partner_start_at);
                const [compYear, compMonth] = title.competency.split("-").map(Number);
                const monthsDiff = (compYear - startDate.getFullYear()) * 12 + (compMonth - (startDate.getMonth() + 1));
                if (monthsDiff >= client.ref_partner_recur_months) eligible = false;
              }

              if (eligible) {
                const { data: existingComm } = await supabase.from("financial_titles")
                  .select("id")
                  .eq("org_id", org.id)
                  .eq("commission_type", "recorrente")
                  .eq("partner_id", client.ref_partner_id)
                  .eq("reference_title_id", title.id)
                  .eq("competency", title.competency)
                  .limit(1);

                if (!existingComm || existingComm.length === 0) {
                  const commissionValue = Math.round((title.value_final || 0) * client.ref_partner_recur_percent / 100 * 100) / 100;
                  if (commissionValue > 0) {
                    const commDueDate = new Date(title.due_at!);
                    commDueDate.setDate(commDueDate.getDate() + 7);
                    await supabase.from("financial_titles").insert({
                      org_id: org.id,
                      type: "pagar",
                      origin: "comissao_parceiro",
                      commission_type: "recorrente",
                      partner_id: client.ref_partner_id,
                      reference_title_id: title.id,
                      client_id: title.client_id,
                      competency: title.competency,
                      description: `Comissão recorrente ${title.competency}`,
                      value_original: commissionValue,
                      value_final: commissionValue,
                      due_at: commDueDate.toISOString().split("T")[0],
                      status: "aberto",
                    });
                    totalRecurCommissions++;
                  }
                }
              }
            }
          } catch (_err) {
            // Skip on error for this title
          }
        }

        totalProcessed++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed: totalProcessed, notifications: totalNotifications, tasks: totalTasks, recurCommissions: totalRecurCommissions, pushSent: totalPushSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("billing-cron error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
