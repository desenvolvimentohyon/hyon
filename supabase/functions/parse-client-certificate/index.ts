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

    const orgId = profile.org_id;
    const { fileBase64, password, clientId } = await req.json();

    if (!fileBase64 || !password || !clientId) {
      return jsonResponse(
        { error: "Arquivo, senha e clientId são obrigatórios" },
        400
      );
    }

    // Verifica se o cliente pertence à org
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("org_id", orgId)
      .single();

    if (!client) return jsonResponse({ error: "Cliente não encontrado" }, 404);

    let parsed;
    try {
      parsed = parsePkcs12(fileBase64, password);
    } catch (e) {
      return jsonResponse({ error: (e as Error).message }, 400);
    }

    const { cn, validFrom, validTo, binaryStr } = parsed;

    const filePath = `${orgId}/${clientId}/certificado.pfx`;
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await adminClient.storage
      .from("client-attachments")
      .upload(filePath, binaryStrToBytes(binaryStr), {
        contentType: "application/x-pkcs12",
        upsert: true,
      });

    const { error: updateError } = await supabase
      .from("clients")
      .update({
        cert_expires_at: validTo,
        cert_file_path: filePath,
        cert_recognition_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", clientId)
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
      cert_valid_from: validFrom,
      cert_valid_to: validTo,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("parse-client-certificate error:", msg);
    return jsonResponse({ error: "Erro interno ao processar certificado" }, 500);
  }
});
