// Edge function: delete-user
// Desativa o usuário no profile e bloqueia login no Auth, mantendo soft-delete.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version, accept-profile, content-profile, prefer",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DeleteUserBodySchema = z.object({
  user_id: z.string().uuid("Usuário inválido"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Missing bearer token" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) return json({ error: "Configuração do backend ausente" }, 500);

    const supabaseCaller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabaseCaller.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sessão inválida" }, 401);

    const parsed = DeleteUserBodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.errors[0]?.message ?? "Dados inválidos" }, 400);

    const callerId = userData.user.id;
    const targetId = parsed.data.user_id;
    if (callerId === targetId) return json({ error: "Você não pode desativar o próprio usuário." }, 400);

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: callerProfile, error: callerProfileErr } = await supabaseAdmin
      .from("profiles")
      .select("id, org_id, role, custom_role_id")
      .eq("id", callerId)
      .single();

    if (callerProfileErr || !callerProfile) return json({ error: "Perfil do solicitante não encontrado" }, 403);

    let allowed = callerProfile.role === "admin";
    if (!allowed && callerProfile.custom_role_id) {
      const { data: customRole } = await supabaseAdmin
        .from("custom_roles")
        .select("permissions")
        .eq("id", callerProfile.custom_role_id)
        .single();
      const permissions = (customRole?.permissions as string[]) ?? [];
      allowed = permissions.includes("usuarios:desativar") ||
        permissions.includes("usuarios:editar") ||
        permissions.includes("configuracoes:editar");
    }
    if (!allowed) return json({ error: "Sem permissão para desativar usuários" }, 403);

    const { data: targetProfile, error: targetErr } = await supabaseAdmin
      .from("profiles")
      .select("id, org_id")
      .eq("id", targetId)
      .single();

    if (targetErr || !targetProfile) return json({ error: "Usuário não encontrado" }, 404);
    if (targetProfile.org_id !== callerProfile.org_id) return json({ error: "Usuário pertence a outra organização" }, 403);

    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: false })
      .eq("id", targetId)
      .eq("org_id", callerProfile.org_id);

    if (profileErr) return json({ error: "Falha ao desativar perfil: " + profileErr.message }, 500);

    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(targetId, {
      ban_duration: "876000h",
    });

    if (authErr) return json({ error: "Perfil desativado, mas falha ao bloquear login: " + authErr.message }, 500);

    return json({ ok: true }, 200);
  } catch (e) {
    console.error("[delete-user] error:", e);
    return json({ error: (e as Error).message ?? "Erro interno" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}