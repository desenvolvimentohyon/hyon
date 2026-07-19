import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY")!;

const FN_URL = `${SUPABASE_URL}/functions/v1/parse-client-certificate`;

const post = (headers: Record<string, string>, body?: unknown) =>
  fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

Deno.test("parse-client-certificate: OPTIONS retorna CORS", async () => {
  const res = await fetch(FN_URL, { method: "OPTIONS" });
  await res.text();
  assertEquals(res.status, 200);
  assert(res.headers.get("access-control-allow-origin"));
});

Deno.test("parse-client-certificate: sem Authorization -> 401", async () => {
  const res = await post({});
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Unauthorized");
});

Deno.test("parse-client-certificate: Authorization malformado -> 401", async () => {
  const res = await post({ Authorization: "Token abc" });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Unauthorized");
});

Deno.test("parse-client-certificate: anon key não autentica usuário -> 401", async () => {
  const res = await post({ Authorization: `Bearer ${ANON_KEY}` });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Unauthorized");
});

Deno.test("parse-client-certificate: JWT bogus -> 401", async () => {
  const res = await post(
    { Authorization: "Bearer invalid.jwt.token" },
    { fileBase64: "AAAA", password: "x", clientId: "00000000-0000-0000-0000-000000000000" },
  );
  const body = await res.json();
  assertEquals(res.status, 401);
  assert(typeof body.error === "string");
});
