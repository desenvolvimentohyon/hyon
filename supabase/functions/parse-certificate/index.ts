import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as forge from "npm:node-forge@1.3.1";

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
    // Auth
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

    // Get org_id
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

    if (profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = profile.org_id;

    const { fileBase64, password } = await req.json();

    if (!fileBase64 || !password) {
      return new Response(JSON.stringify({ error: "Arquivo e senha são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64 to binary
    const binaryStr = atob(fileBase64);
    const derBytes = forge.util.createBuffer(binaryStr, "raw");

    // Parse PKCS#12
    let p12;
    try {
      const asn1 = forge.asn1.fromDer(derBytes);
      p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: "Senha incorreta ou arquivo inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract certificate
    const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBags = bags[forge.pki.oids.certBag];

    if (!certBags || certBags.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum certificado encontrado no arquivo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cert = certBags[0].cert!;
    const subject = cert.subject;
    const issuer = cert.issuer;

    // Extract CN
    const cnAttr = subject.getField("CN");
    const cn = cnAttr ? cnAttr.value : null;

    // Extract CNPJ from subject (commonly in serialNumber or OID 2.16.76.1.3.3)
    let cnpj: string | null = null;

    // Try serialNumber field first
    const serialAttr = subject.getField({ name: "serialName" }) || subject.getField("2.5.4.5");
    if (serialAttr) {
      const digits = String(serialAttr.value).replace(/\D/g, "");
      if (digits.length >= 14) {
        cnpj = digits.slice(0, 14);
      }
    }

    // Try OID 2.16.76.1.3.3 (ICP-Brasil CNPJ)
    if (!cnpj) {
      for (const attr of subject.attributes) {
        if (attr.type === "2.16.76.1.3.3") {
          const digits = String(attr.value).replace(/\D/g, "");
          if (digits.length >= 14) {
            cnpj = digits.slice(0, 14);
          }
        }
      }
    }

    // Also try to extract from CN string (common format: "EMPRESA:CNPJ")
    if (!cnpj && cn) {
      const cnpjMatch = cn.match(/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/);
      if (cnpjMatch) {
        cnpj = cnpjMatch[1].replace(/\D/g, "");
      }
    }

    // Extract issuer CN
    const issuerCn = issuer.getField("CN");
    const issuerName = issuerCn ? issuerCn.value : null;

    // Dates
    const validFrom = cert.validity.notBefore.toISOString().split("T")[0];
    const validTo = cert.validity.notAfter.toISOString().split("T")[0];

    // Upload file to storage
    const fileBytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
    const filePath = `${orgId}/company-cert.pfx`;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await adminClient.storage.from("certificates").upload(filePath, fileBytes, {
      contentType: "application/x-pkcs12",
      upsert: true,
    });

    // Update company_profile
    const updatePayload = {
      cert_file_path: filePath,
      cert_cn: cn,
      cert_cnpj: cnpj,
      cert_issuer: issuerName,
      cert_valid_from: validFrom,
      cert_valid_to: validTo,
      certificate_expiration: validTo,
    };

    const { error: updateError } = await supabase
      .from("company_profile")
      .update(updatePayload)
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
        cert_cnpj: cnpj,
        cert_issuer: issuerName,
        cert_valid_from: validFrom,
        cert_valid_to: validTo,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("parse-certificate error:", e);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar certificado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
