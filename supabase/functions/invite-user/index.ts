// Edge function: invite-user
// Convida um usuário por e-mail e vincula o profile à organização do admin chamador.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InviteBody {
  email: string;
  full_name?: string;
  role?: string;
  custom_role_id?: string | null;
  phone?: string;
}

const DEFAULT_ROLES = new Set([
  "admin",
  "financeiro",
  "comercial",
  "suporte",
  "implantacao",
  "leitura",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing bearer token" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client "as caller" — respeita RLS e valida o JWT.
    const supabaseCaller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabaseCaller.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Invalid session" }, 401);
    }
    const callerId = userData.user.id;

    // Admin client (service role) — bypassa RLS.
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Carrega profile do chamador para validar permissão + org.
    const { data: callerProfile, error: callerProfErr } = await supabaseAdmin
      .from("profiles")
      .select("id, org_id, role, custom_role_id")
      .eq("id", callerId)
      .single();

    if (callerProfErr || !callerProfile) {
      return json({ error: "Caller profile not found" }, 403);
    }

    // Regra de permissão: admin do sistema OU perfil custom contendo permissão de gestão.
    let allowed = callerProfile.role === "admin";
    if (!allowed && callerProfile.custom_role_id) {
      const { data: role } = await supabaseAdmin
        .from("custom_roles")
        .select("permissions")
        .eq("id", callerProfile.custom_role_id)
        .single();
      const perms: string[] = (role?.permissions as string[]) ?? [];
      allowed = perms.includes("configuracoes:usuarios") ||
        perms.includes("usuarios:gerenciar") ||
        perms.includes("configuracoes:editar");
    }
    if (!allowed) {
      return json({ error: "Sem permissão para convidar usuários" }, 403);
    }

    const body = (await req.json().catch(() => null)) as InviteBody | null;
    if (!body?.email || typeof body.email !== "string") {
      return json({ error: "Campo 'email' é obrigatório" }, 400);
    }
    const email = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "E-mail inválido" }, 400);
    }

    const orgId = callerProfile.org_id;
    const fullName = (body.full_name ?? "").trim() || email;
    const phone = body.phone?.trim() || null;

    // Resolve role/custom_role_id a partir do roleId enviado.
    let dbRole: string = "leitura";
    let customRoleId: string | null = null;
    const requested = body.role || body.custom_role_id || "leitura";
    if (DEFAULT_ROLES.has(requested)) {
      dbRole = requested;
    } else {
      // Assume UUID de custom role — valida que pertence à org.
      const { data: cr } = await supabaseAdmin
        .from("custom_roles")
        .select("id")
        .eq("id", requested)
        .eq("org_id", orgId)
        .maybeSingle();
      if (!cr) {
        return json({ error: "Perfil (role) inválido" }, 400);
      }
      customRoleId = requested;
      dbRole = "leitura";
    }

    // Envia o convite. Se o e-mail já existir, retorna erro amigável.
    const redirectTo = req.headers.get("origin")
      ? `${req.headers.get("origin")}/auth`
      : undefined;

    const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin
      .inviteUserByEmail(email, {
        data: { full_name: fullName },
        redirectTo,
      });

    if (inviteErr || !inviteData?.user) {
      const msg = inviteErr?.message ?? "Falha ao enviar convite";
      const status = /already/i.test(msg) ? 409 : 400;
      return json({ error: msg }, status);
    }

    const newUserId = inviteData.user.id;

    // O trigger handle_new_user já criou uma linha em profiles em uma org default.
    // Sobrescreve para a org do admin chamador.
    // Upsert garante o profile mesmo se o trigger não rodou.
    const { error: upsertErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUserId,
        org_id: orgId,
        full_name: fullName,
        role: dbRole,
        custom_role_id: customRoleId,
        phone,
        is_active: true,
      }, { onConflict: "id" });


    if (upsertErr) {
      return json({ error: "Convite enviado, mas falha ao vincular profile: " + upsertErr.message }, 500);
    }

    return json({ ok: true, user_id: newUserId }, 200);
  } catch (e) {
    console.error("[invite-user] error:", e);
    return json({ error: (e as Error).message ?? "Erro interno" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
