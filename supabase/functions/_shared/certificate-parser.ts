// Shared PKCS#12 certificate parsing utilities.
// Used by parse-certificate (empresa) and parse-client-certificate (cliente).
import forge from "https://esm.sh/node-forge@1.3.1";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export interface ParsedCertificate {
  cn: string | null;
  cnpj: string | null;
  issuer: string | null;
  validFrom: string | null;
  validTo: string | null;
  binaryStr: string;
}

/**
 * Decodifica um PKCS#12 (base64) usando a senha e extrai metadados do certificado.
 * Lança Error com mensagem amigável quando a senha está incorreta ou o arquivo é inválido.
 */
export function parsePkcs12(fileBase64: string, password: string): ParsedCertificate {
  const binaryStr = atob(fileBase64);
  const derBytes = forge.util.createBuffer(binaryStr, "raw");

  let p12;
  try {
    const asn1 = forge.asn1.fromDer(derBytes);
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);
  } catch {
    throw new Error("Senha incorreta ou arquivo inválido");
  }

  const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBags = bags[forge.pki.oids.certBag];
  if (!certBags || certBags.length === 0) {
    throw new Error("Nenhum certificado encontrado no arquivo");
  }

  const cert = certBags[0].cert!;
  const subject = cert.subject;
  const issuer = cert.issuer;

  const cnAttr = subject.getField("CN");
  const cn = cnAttr ? cnAttr.value : null;

  // CNPJ: tenta serialNumber -> OID 2.16.76.1.3.3 -> extrair do CN
  let cnpj: string | null = null;
  const serialAttr =
    subject.getField({ name: "serialName" }) || subject.getField("2.5.4.5");
  if (serialAttr) {
    const digits = String(serialAttr.value).replace(/\D/g, "");
    if (digits.length >= 14) cnpj = digits.slice(0, 14);
  }
  if (!cnpj) {
    for (const attr of subject.attributes) {
      if (attr.type === "2.16.76.1.3.3") {
        const digits = String(attr.value).replace(/\D/g, "");
        if (digits.length >= 14) cnpj = digits.slice(0, 14);
      }
    }
  }
  if (!cnpj && cn) {
    const m = cn.match(/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/);
    if (m) cnpj = m[1].replace(/\D/g, "");
  }

  const issuerCn = issuer.getField("CN");
  const issuerName = issuerCn ? issuerCn.value : null;

  let validFrom: string | null = null;
  let validTo: string | null = null;
  try {
    validFrom =
      cert.validity.notBefore instanceof Date
        ? cert.validity.notBefore.toISOString().split("T")[0]
        : String(cert.validity.notBefore).split("T")[0];
    validTo =
      cert.validity.notAfter instanceof Date
        ? cert.validity.notAfter.toISOString().split("T")[0]
        : String(cert.validity.notAfter).split("T")[0];
  } catch (e) {
    console.error("Date parsing error:", e);
  }

  return { cn, cnpj, issuer: issuerName, validFrom, validTo, binaryStr };
}

/** Converte a string binária (do atob) em Uint8Array para upload no Storage. */
export function binaryStrToBytes(binaryStr: string): Uint8Array {
  return Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
}
