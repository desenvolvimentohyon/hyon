// Edge function: invite-user
// Cria, reativa ou atualiza um usuário e vincula o profile à organização do admin chamador.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version, accept-profile, content-profile, prefer",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_ROLES = new Set([
  "admin",
  "financeiro",
  "comercial",
  "suporte",
  "implantacao",
  "leitura",
]);

const InviteBodySchema = z.object({
  email: z.string().email("E-mail inválido").max(320),
  full_name: z.string().trim().min(1).max(255).optional(),
  role: z.string().trim().min(1).max(120).optional(),
  custom_role_id: z.string().uuid().nullable().optional(),
  phone: z.string().trim().max(40).optional().nullable(),
  password: z.string().trim().min(6, "A senha deve ter no mínimo 6 caracteres").max(128).optional().or(z.literal("")),
});

type SupabaseAdminClient = ReturnType<typeof createClient>;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Missing bearer token" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
      return json({ error: "Configuração do backend ausente" }, 500);
    }

    const supabaseCaller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabaseCaller.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sessão inválida" }, 401);

    const callerId = userData.user.id;
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: callerProfile, error: callerProfErr } = await supabaseAdmin
      .from("profiles")
      .select("id, org_id, role, custom_role_id")
      .eq("id", callerId)
      .single();

    if (callerProfErr || !callerProfile) return json({ error: "Perfil do solicitante não encontrado" }, 403);

    let allowed = callerProfile.role === "admin";
    if (!allowed && callerProfile.custom_role_id) {
      const { data: role } = await supabaseAdmin
        .from("custom_roles")
        .select("permissions")
        .eq("id", callerProfile.custom_role_id)
        .single();
      const perms = (role?.permissions as string[]) ?? [];
      allowed = perms.includes("usuarios:criar") ||
        perms.includes("usuarios:editar") ||
        perms.includes("configuracoes:editar");
    }
    if (!allowed) return json({ error: "Sem permissão para criar usuários" }, 403);

    const parsed = InviteBodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.errors[0]?.message ?? "Dados inválidos" }, 400);

    const body = parsed.data;
    const email = body.email.trim().toLowerCase();
    const orgId = callerProfile.org_id;
    const fullName = (body.full_name ?? "").trim() || email;
    const phone = body.phone?.trim() || null;
    const password = body.password?.trim() || null;

    let dbRole = "leitura";
    let customRoleId: string | null = null;
    const requested = body.role || body.custom_role_id || "leitura";
    if (DEFAULT_ROLES.has(requested)) {
      dbRole = requested;
    } else {
      const { data: customRole } = await supabaseAdmin
        .from("custom_roles")
        .select("id")
        .eq("id", requested)
        .eq("org_id", orgId)
        .maybeSingle();
      if (!customRole) return json({ error: "Perfil de acesso inválido" }, 400);
      customRoleId = requested;
    }

    let targetUserId: string;
    if (password) {
      const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createErr || !createData?.user) {
        const msg = createErr?.message ?? "Falha ao criar usuário";
        if (!/already|registered|exists/i.test(msg)) return json({ error: msg }, 400);

        const existingUser = await findUserByEmail(supabaseAdmin, email);
        if (!existingUser) return json({ error: "E-mail já cadastrado, mas não foi possível localizar o usuário." }, 409);

        const ownership = await ensureSameOrgOrEmptyProfile(supabaseAdmin, existingUser.id, orgId);
        if (!ownership.ok) return json({ error: ownership.error }, 409);

        const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
          ban_duration: "none",
          user_metadata: { full_name: fullName },
        });
        if (updateAuthErr) {
          return json({ error: "Usuário já existe, mas não foi possível atualizar a senha: " + updateAuthErr.message }, 400);
        }
        targetUserId = existingUser.id;
      } else {
        targetUserId = createData.user.id;
      }
    } else {
      const redirectTo = req.headers.get("origin") ? `${req.headers.get("origin")}/auth` : undefined;
      const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
        redirectTo,
      });

      if (inviteErr || !inviteData?.user) {
        const msg = inviteErr?.message ?? "Falha ao enviar convite";
        if (!/already|registered|exists/i.test(msg)) return json({ error: msg }, 400);

        const existingUser = await findUserByEmail(supabaseAdmin, email);
        if (!existingUser) return json({ error: "E-mail já cadastrado, mas não foi possível localizar o usuário." }, 409);
        const ownership = await ensureSameOrgOrEmptyProfile(supabaseAdmin, existingUser.id, orgId);
        if (!ownership.ok) return json({ error: ownership.error }, 409);
        targetUserId = existingUser.id;
      } else {
        targetUserId = inviteData.user.id;
      }
    }

    const { error: reactivateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      ban_duration: "none",
      user_metadata: { full_name: fullName },
    });

    if (reactivateAuthErr) {
      return json({ error: "Usuário localizado, mas não foi possível liberar o acesso: " + reactivateAuthErr.message }, 500);
    }

    const { error: upsertErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: targetUserId,
        org_id: orgId,
        email,
        full_name: fullName,
        role: dbRole,
        custom_role_id: customRoleId,
        phone,
        is_active: true,
      }, { onConflict: "id" });

    if (upsertErr) return json({ error: "Falha ao vincular perfil: " + upsertErr.message }, 500);

    return json({ ok: true, user_id: targetUserId }, 200);
  } catch (e) {
    console.error("[invite-user] error:", e);
    return json({ error: (e as Error).message ?? "Erro interno" }, 500);
  }
});

async function findUserByEmail(supabaseAdmin: SupabaseAdminClient, email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 1000) break;
  }
  return null;
}

async function ensureSameOrgOrEmptyProfile(supabaseAdmin: SupabaseAdminClient, userId: string, orgId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("org_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { ok: false, error: "Falha ao validar vínculo do usuário: " + error.message };
  if (profile?.org_id && profile.org_id !== orgId) {
    return { ok: false, error: "Este e-mail já pertence a outra organização." };
  }
  return { ok: true };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}