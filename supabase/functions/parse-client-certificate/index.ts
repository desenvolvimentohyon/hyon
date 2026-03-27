import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import forge from "https://esm.sh/node-forge@1.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = profile.org_id;
    const { fileBase64, password, clientId } = await req.json();

    if (!fileBase64 || !password || !clientId) {
      return new Response(JSON.stringify({ error: "Arquivo, senha e clientId são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify client belongs to org
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("org_id", orgId)
      .single();

    if (!client) {
      return new Response(JSON.stringify({ error: "Cliente não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode and parse PKCS#12
    const binaryStr = atob(fileBase64);
    const derBytes = forge.util.createBuffer(binaryStr, "raw");

    let p12;
    try {
      const asn1 = forge.asn1.fromDer(derBytes);
      p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);
    } catch {
      return new Response(
        JSON.stringify({ error: "Senha incorreta ou arquivo inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBags = bags[forge.pki.oids.certBag];

    if (!certBags || certBags.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum certificado encontrado no arquivo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cert = certBags[0].cert!;
    const cnAttr = cert.subject.getField("CN");
    const cn = cnAttr ? cnAttr.value : null;
    const validFrom = cert.validity.notBefore.toISOString().split("T")[0];
    const validTo = cert.validity.notAfter.toISOString().split("T")[0];

    // Upload file to storage
    const fileBytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
    const filePath = `${orgId}/${clientId}/certificado.pfx`;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await adminClient.storage.from("client-attachments").upload(filePath, fileBytes, {
      contentType: "application/x-pkcs12",
      upsert: true,
    });

    // Update client
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
      return new Response(
        JSON.stringify({ error: "Erro ao salvar dados: " + updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        cert_cn: cn,
        cert_valid_from: validFrom,
        cert_valid_to: validTo,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("parse-client-certificate error:", e);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar certificado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
