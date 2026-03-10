import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter: max 5 requests per minute per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(cleaned[i]) * weights1[i];
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(cleaned[12]) !== digit1) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(cleaned[i]) * weights2[i];
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(cleaned[13]) !== digit2) return false;

  return true;
}

async function fetchFromBrasilAPI(cnpj: string) {
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
  if (!res.ok) {
    const body = await res.text();
    console.error(`BrasilAPI returned ${res.status}: ${body}`);
    return null;
  }
  const data = await res.json();
  return {
    nome: data.razao_social || "",
    fantasia: data.nome_fantasia || "",
    logradouro: data.logradouro || data.descricao_tipo_de_logradouro ? `${data.descricao_tipo_de_logradouro || ""} ${data.logradouro || ""}`.trim() : "",
    numero: data.numero || "",
    complemento: data.complemento || "",
    bairro: data.bairro || "",
    municipio: data.municipio || "",
    uf: data.uf || "",
    cep: (data.cep || "").toString().replace(/\D/g, ""),
    situacao: data.descricao_situacao_cadastral || "",
    abertura: data.data_inicio_atividade || "",
    natureza_juridica: data.natureza_juridica || "",
    email: data.email || "",
    telefone: data.ddd_telefone_1 || "",
  };
}

async function fetchFromReceitaWS(cnpj: string) {
  const res = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`ReceitaWS returned ${res.status}: ${body}`);
    return null;
  }
  const data = await res.json();
  if (data.status === "ERROR") return null;
  return {
    nome: data.nome || "",
    fantasia: data.fantasia || "",
    logradouro: data.logradouro || "",
    numero: data.numero || "",
    complemento: data.complemento || "",
    bairro: data.bairro || "",
    municipio: data.municipio || "",
    uf: data.uf || "",
    cep: (data.cep || "").replace(/\D/g, ""),
    situacao: data.situacao || "",
    abertura: data.abertura || "",
    natureza_juridica: data.natureza_juridica || "",
    email: data.email || "",
    telefone: data.telefone || "",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: "Muitas consultas. Aguarde 1 minuto." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const cnpjRaw = (body.cnpj || "").replace(/\D/g, "");

    if (!validateCNPJ(cnpjRaw)) {
      return new Response(JSON.stringify({ error: "CNPJ inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try BrasilAPI first (free, no auth needed), fallback to ReceitaWS
    let result = await fetchFromBrasilAPI(cnpjRaw);
    if (!result) {
      console.log("BrasilAPI failed, trying ReceitaWS...");
      result = await fetchFromReceitaWS(cnpjRaw);
    }

    if (!result) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada. Verifique o CNPJ digitado." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("cnpj-lookup error:", error);
    return new Response(JSON.stringify({ error: "Erro ao consultar CNPJ. Tente novamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
