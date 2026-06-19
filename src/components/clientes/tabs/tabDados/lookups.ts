import { supabase } from "@/integrations/supabase/client";

export async function lookupCnpj(cleanedCnpj: string) {
  const { data, error } = await supabase.functions.invoke("cnpj-lookup", { body: { cnpj: cleanedCnpj } });
  if (error || !data || data.error) {
    throw new Error(data?.error || "Erro ao consultar CNPJ");
  }
  return data as {
    fantasia?: string; nome?: string; cep?: string; logradouro?: string; numero?: string;
    complemento?: string; bairro?: string; municipio?: string; uf?: string; email?: string; telefone?: string;
  };
}

export async function lookupCep(cep: string) {
  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data = await res.json();
  if (data.erro) throw new Error("CEP não encontrado");
  return data as { logradouro?: string; bairro?: string; localidade?: string; uf?: string };
}
