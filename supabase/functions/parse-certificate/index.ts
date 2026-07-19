import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  corsHeaders,
  jsonResponse,
  parsePkcs12,
  binaryStrToBytes,
} from "../_shared/certificate-parser.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) return jsonResponse({ error: "Profile not found" }, 403);
    if (profile.role !== "admin") {
      return jsonResponse({ error: "Acesso restrito a administradores" }, 403);
    }

    const orgId = profile.org_id;
    const { fileBase64, password } = await req.json();

    if (!fileBase64 || !password) {
      return jsonResponse({ error: "Arquivo e senha são obrigatórios" }, 400);
    }

    let parsed;
    try {
      parsed = parsePkcs12(fileBase64, password);
    } catch (e) {
      return jsonResponse({ error: (e as Error).message }, 400);
    }

    const { cn, cnpj, issuer, validFrom, validTo, binaryStr } = parsed;

    // Upload
    const filePath = `${orgId}/company-cert.pfx`;
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await adminClient.storage
      .from("certificates")
      .upload(filePath, binaryStrToBytes(binaryStr), {
        contentType: "application/x-pkcs12",
        upsert: true,
      });

    const updatePayload: Record<string, unknown> = {
      cert_file_path: filePath,
      cert_cn: cn,
      cert_cnpj: cnpj,
      cert_issuer: issuer,
    };
    if (validFrom) updatePayload.cert_valid_from = validFrom;
    if (validTo) {
      updatePayload.cert_valid_to = validTo;
      updatePayload.certificate_expiration = validTo;
    }

    const { error: updateError } = await supabase
      .from("company_profile")
      .update(updatePayload)
      .eq("org_id", orgId);

    if (updateError) {
      return jsonResponse(
        { error: "Erro ao salvar dados: " + updateError.message },
        500
      );
    }

    return jsonResponse({
      success: true,
      cert_cn: cn,
      cert_cnpj: cnpj,
      cert_issuer: issuer,
      cert_valid_from: validFrom,
      cert_valid_to: validTo,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("parse-certificate error:", msg);
    return jsonResponse({ error: "Erro interno ao processar certificado: " + msg }, 500);
  }
});
