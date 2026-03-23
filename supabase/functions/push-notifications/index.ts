import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Minimal web-push implementation using Web Crypto
async function sendWebPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string, vapidPublicKey: string, vapidPrivateKey: string) {
  const vapidSubject = "mailto:push@hyon.com.br";

  // Import VAPID private key
  const privateKeyBytes = base64urlToUint8Array(vapidPrivateKey);
  const publicKeyBytes = base64urlToUint8Array(vapidPublicKey);

  // Create JWT for VAPID
  const audience = new URL(subscription.endpoint).origin;
  const jwt = await createVapidJwt(audience, vapidSubject, privateKeyBytes);

  // Encrypt payload
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

async function createVapidJwt(audience: string, subject: string, privateKeyBytes: Uint8Array): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 86400, sub: subject };

  const headerB64 = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: uint8ArrayToBase64url(privateKeyBytes),
      x: "", // Will be filled
      y: "",
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  ).catch(async () => {
    // Try raw import with pkcs8
    const pkcs8 = createPkcs8FromRaw(privateKeyBytes);
    return crypto.subtle.importKey("pkcs8", pkcs8, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  });

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s
  const sigBytes = new Uint8Array(signature);
  let rawSig: Uint8Array;
  if (sigBytes.length === 64) {
    rawSig = sigBytes;
  } else {
    rawSig = derToRaw(sigBytes);
  }

  return `${unsignedToken}.${uint8ArrayToBase64url(rawSig)}`;
}

function createPkcs8FromRaw(rawKey: Uint8Array): ArrayBuffer {
  // PKCS8 wrapper for EC P-256 private key
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
  // DER: 0x30 len 0x02 rlen r 0x02 slen s
  let offset = 2; // skip 0x30 len
  offset += 1; // skip 0x02
  const rLen = der[offset++];
  const rStart = offset + (rLen > 32 ? rLen - 32 : 0);
  raw.set(der.slice(rStart, offset + rLen), 32 - Math.min(rLen, 32));
  offset += rLen;
  offset += 1; // skip 0x02
  const sLen = der[offset++];
  const sStart = offset + (sLen > 32 ? sLen - 32 : 0);
  raw.set(der.slice(sStart, offset + sLen), 64 - Math.min(sLen, 32));
  return raw;
}

async function encryptPayload(p256dhKey: string, authSecret: string, payload: Uint8Array): Promise<ArrayBuffer> {
  const clientPublicKey = base64urlToUint8Array(p256dhKey);
  const clientAuth = base64urlToUint8Array(authSecret);

  // Generate ephemeral ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPublicKey = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));

  // Import client public key
  const clientKey = await crypto.subtle.importKey("raw", clientPublicKey, { name: "ECDH", namedCurve: "P-256" }, false, []);

  // Derive shared secret
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, localKeyPair.privateKey, 256));

  // HKDF for auth secret
  const authInfo = concatBuffers(
    new TextEncoder().encode("WebPush: info\0"),
    clientPublicKey,
    localPublicKey
  );

  const ikm = await hkdf(clientAuth, sharedSecret, authInfo, 32);

  // Key and nonce derivation
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");

  const contentKey = await hkdf(salt, ikm, keyInfo, 16);
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  // Pad payload with delimiter
  const paddedPayload = concatBuffers(payload, new Uint8Array([2]));

  // Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"]);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPayload));

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + encrypted
  const rs = new ArrayBuffer(4);
  new DataView(rs).setUint32(0, 4096);
  const header = concatBuffers(
    salt,
    new Uint8Array(rs),
    new Uint8Array([65]),
    localPublicKey
  );

  return concatBuffers(header, encrypted).buffer;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, salt.length ? salt : new Uint8Array(32)));

  const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const infoWithCounter = concatBuffers(info, new Uint8Array([1]));
  const derived = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, infoWithCounter));
  return derived.slice(0, length);
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const total = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) {
    result.set(b, offset);
    offset += b.length;
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || (await req.clone().json().catch(() => ({}))).action;

    // get-vapid-key is public
    if (action === "get-vapid-key") {
      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
      if (!vapidPublicKey) {
        return new Response(JSON.stringify({ error: "VAPID key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ vapidPublicKey }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // All other actions require auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    // Get org_id from profile
    const { data: profileData } = await supabase.from("profiles").select("org_id").eq("id", userId).single();
    if (!profileData) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const orgId = profileData.org_id;

    const body = await req.json().catch(() => ({}));

    if (action === "subscribe") {
      const { endpoint, p256dh, auth, userAgent, deviceName } = body;
      if (!endpoint || !p256dh || !auth) {
        return new Response(JSON.stringify({ error: "Missing subscription data" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          org_id: orgId,
          endpoint,
          p256dh,
          auth,
          user_agent: userAgent || null,
          device_name: deviceName || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "unsubscribe") {
      const { endpoint } = body;
      if (endpoint) {
        await supabase.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", endpoint);
      } else {
        // Remove all subscriptions for this user
        await supabase.from("push_subscriptions").delete().eq("user_id", userId);
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "test") {
      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
      const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

      const { data: subs } = await supabase.from("push_subscriptions").select("*").eq("user_id", userId).eq("is_active", true);

      if (!subs || subs.length === 0) {
        return new Response(JSON.stringify({ error: "Nenhum dispositivo registrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const payload = JSON.stringify({
        title: "🔔 Notificação de Teste",
        body: "Notificações push ativadas com sucesso!",
        icon: "/pwa-192x192.png",
        url: "/configuracoes",
      });

      let sent = 0;
      for (const sub of subs) {
        try {
          await sendWebPush(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            vapidPublicKey,
            vapidPrivateKey
          );
          sent++;
        } catch (err) {
          console.error("Push failed for sub:", sub.id, err);
          // If push failed with 410 Gone, mark as inactive
          if (err.message?.includes("410")) {
            await supabase.from("push_subscriptions").update({ is_active: false }).eq("id", sub.id);
          }
        }
      }

      return new Response(JSON.stringify({ success: true, sent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "send") {
      // Internal use: send push to specific users
      const { userIds, title, messageBody, url: targetUrl, orgId: targetOrgId } = body;
      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
      const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

      // Use service role for cross-user sends
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminClient = createClient(supabaseUrl, serviceKey);

      let query = adminClient.from("push_subscriptions").select("*").eq("is_active", true);
      if (targetOrgId) query = query.eq("org_id", targetOrgId);
      if (userIds?.length) query = query.in("user_id", userIds);

      const { data: subs } = await query;
      if (!subs || subs.length === 0) {
        return new Response(JSON.stringify({ success: true, sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const payload = JSON.stringify({
        title: title || "Hyon Tech",
        body: messageBody || "",
        icon: "/pwa-192x192.png",
        url: targetUrl || "/",
      });

      let sent = 0;
      for (const sub of subs) {
        try {
          await sendWebPush(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            vapidPublicKey,
            vapidPrivateKey
          );
          sent++;
        } catch (err) {
          console.error("Push send error:", err);
          if (err.message?.includes("410")) {
            await adminClient.from("push_subscriptions").update({ is_active: false }).eq("id", sub.id);
          }
        }
      }

      return new Response(JSON.stringify({ success: true, sent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "devices") {
      const { data: subs } = await supabase.from("push_subscriptions").select("id, device_name, user_agent, is_active, created_at, updated_at").eq("user_id", userId).order("created_at", { ascending: false });
      return new Response(JSON.stringify({ devices: subs || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Push notification error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
