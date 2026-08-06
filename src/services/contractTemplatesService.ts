import { supabase } from "@/integrations/supabase/client";
import { validateCNPJ } from "@/lib/cnpjUtils";
import { logger } from "@/core/logger/logger";

/**
 * Camada de acesso aos templates de contrato e à extração de variáveis
 * dinâmicas que alimentam o prompt da IA na geração de contratos.
 *
 * Estrutura técnica de armazenamento (tabela `contract_templates`):
 * - `body`            → corpo do contrato com placeholders `{{variavel}}`
 * - `variables`       → JSONB: catálogo declarado de variáveis do template
 * - `ai_instructions` → diretrizes de redação enviadas ao modelo
 * - `category`        → saas | implantacao | desenvolvimento | cartoes | outro
 * - `is_default`      → template usado quando nenhum é escolhido
 * - `version`         → versionamento incremental do texto
 * - isolamento multi-tenant por `org_id` (RLS) e soft delete via `deleted_at`
 */

export type ContractTemplateCategory =
  | "saas"
  | "implantacao"
  | "desenvolvimento"
  | "cartoes"
  | "outro";

export interface ContractTemplateVariable {
  /** chave usada no corpo do contrato, ex.: `cliente_cnpj` */
  key: string;
  /** rótulo legível exibido na interface */
  label: string;
  /** origem do dado (tabela.coluna ou cálculo) — documentação para a IA */
  source: string;
  required: boolean;
}

export interface ContractTemplate {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  category: ContractTemplateCategory;
  body: string;
  variables: ContractTemplateVariable[];
  ai_instructions: string | null;
  is_default: boolean;
  active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

/** Catálogo canônico de variáveis dinâmicas disponíveis para os contratos. */
export const CONTRACT_VARIABLES: ContractTemplateVariable[] = [
  { key: "cliente_nome", label: "Nome do cliente", source: "clients.name", required: true },
  { key: "cliente_razao_social", label: "Razão social", source: "clients.legal_name", required: false },
  { key: "cliente_nome_fantasia", label: "Nome fantasia", source: "clients.trade_name", required: false },
  { key: "cliente_cnpj", label: "CNPJ/CPF", source: "clients.document", required: true },
  { key: "cliente_ie", label: "Inscrição estadual", source: "clients.state_registration", required: false },
  { key: "cliente_email", label: "E-mail", source: "clients.email", required: false },
  { key: "cliente_telefone", label: "Telefone", source: "clients.phone", required: false },
  { key: "cliente_endereco", label: "Endereço completo", source: "clients.address_* (composto)", required: false },
  { key: "cliente_regime_tributario", label: "Regime tributário", source: "clients.tax_regime", required: false },
  { key: "cliente_responsavel", label: "Responsável legal", source: "clients.primary_contact_name", required: false },
  { key: "sistema_nome", label: "Sistema contratado", source: "clients.system_name", required: false },
  { key: "modulos_lista", label: "Módulos contratados", source: "client_modules + system_modules", required: false },
  { key: "valor_mensalidade", label: "Valor da mensalidade", source: "clients.monthly_value_final", required: true },
  { key: "valor_mensalidade_base", label: "Mensalidade base", source: "clients.monthly_value_base", required: false },
  { key: "dia_vencimento", label: "Dia de vencimento", source: "clients.default_due_day", required: false },
  { key: "data_inicio_contrato", label: "Início do contrato", source: "clients.contract_start_at", required: false },
  { key: "indice_reajuste", label: "Índice de reajuste", source: "clients.adjustment_type", required: false },
  { key: "percentual_reajuste", label: "Percentual de reajuste", source: "clients.adjustment_percent", required: false },
];

export interface ContractModuleData {
  id: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface ContractExtraction {
  clienteId: string;
  nome: string;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  /** CNPJ/CPF apenas com dígitos */
  documento: string | null;
  /** CNPJ/CPF formatado (00.000.000/0000-00 ou 000.000.000-00) */
  documentoFormatado: string | null;
  documentoValido: boolean;
  inscricaoEstadual: string | null;
  email: string | null;
  telefone: string | null;
  enderecoCompleto: string | null;
  regimeTributario: string | null;
  responsavelLegal: string | null;
  sistemaNome: string | null;
  modulos: ContractModuleData[];
  valorModulos: number;
  valorMensalidade: number;
  valorMensalidadeBase: number;
  diaVencimento: number | null;
  dataInicioContrato: string | null;
  indiceReajuste: string | null;
  percentualReajuste: number | null;
  /** campos obrigatórios ausentes — bloqueiam a geração do contrato */
  camposFaltantes: string[];
}

const onlyDigits = (value?: string | null) => (value ?? "").replace(/\D/g, "");

/** Validação de CNPJ (reutiliza `validateCNPJ`) e de CPF (módulo 11). */
export function isValidDocument(raw?: string | null): boolean {
  const doc = onlyDigits(raw);
  if (doc.length === 14) return validateCNPJ(doc);
  if (doc.length === 11) {
    if (/^(\d)\1+$/.test(doc)) return false;
    const calc = (len: number) => {
      let sum = 0;
      for (let i = 0; i < len; i++) sum += Number(doc[i]) * (len + 1 - i);
      const result = (sum * 10) % 11;
      return result === 10 ? 0 : result;
    };
    return calc(9) === Number(doc[9]) && calc(10) === Number(doc[10]);
  }
  return false;
}


export function formatDocument(raw?: string | null): string | null {
  const doc = onlyDigits(raw);
  if (doc.length === 14) {
    return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }
  if (doc.length === 11) {
    return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return doc || null;
}

/**
 * Extrai e valida todos os dados do cliente (incluindo CNPJ e módulos)
 * necessários para montar o prompt de geração de contrato.
 */
export async function extractContractData(clienteId: string): Promise<ContractExtraction> {
  const { data: cliente, error } = await supabase
    .from("clients")
    .select(
      "id, name, legal_name, trade_name, document, state_registration, email, phone, address_street, address_number, address_complement, address_neighborhood, city, address_uf, address_cep, tax_regime, primary_contact_name, system_name, monthly_value_base, monthly_value_final, default_due_day, contract_start_at, adjustment_type, adjustment_percent",
    )
    .eq("id", clienteId)
    .maybeSingle();

  if (error) {
    logger.error("Falha ao extrair dados do cliente para contrato", error);
    throw error;
  }
  if (!cliente) {
    throw new Error("Cliente não encontrado para geração de contrato.");
  }

  // Módulos contratados: quantidade em client_modules, preço em system_modules
  const { data: links, error: linksError } = await supabase
    .from("client_modules")
    .select("module_id, quantity")
    .eq("client_id", clienteId);

  if (linksError) {
    logger.error("Falha ao extrair módulos do cliente para contrato", linksError);
  }

  let modulos: ContractModuleData[] = [];
  const moduleIds = (links ?? []).map((l) => l.module_id).filter(Boolean) as string[];

  if (moduleIds.length > 0) {
    const { data: mods, error: modsError } = await supabase
      .from("system_modules")
      .select("id, name, sale_value")
      .in("id", moduleIds)
      .order("name");

    if (modsError) {
      logger.error("Falha ao carregar catálogo de módulos para contrato", modsError);
    }

    const qtyMap = new Map<string, number>();
    (links ?? []).forEach((l) => qtyMap.set(l.module_id as string, l.quantity ?? 1));

    modulos = (mods ?? []).map((m) => {
      const quantidade = qtyMap.get(m.id) ?? 1;
      const valorUnitario = Number(m.sale_value ?? 0);
      return {
        id: m.id,
        nome: m.name,
        quantidade,
        valorUnitario,
        valorTotal: valorUnitario * quantidade,
      };
    });
  }

  const enderecoPartes = [
    cliente.address_street,
    cliente.address_number,
    cliente.address_complement,
    cliente.address_neighborhood,
    cliente.city,
    cliente.address_uf,
    cliente.address_cep,
  ].filter((p) => !!p && String(p).trim() !== "");

  const documentoDigits = onlyDigits(cliente.document) || null;

  const extraction: ContractExtraction = {
    clienteId: cliente.id,
    nome: cliente.name,
    razaoSocial: cliente.legal_name ?? null,
    nomeFantasia: cliente.trade_name ?? null,
    documento: documentoDigits,
    documentoFormatado: formatDocument(cliente.document),
    documentoValido: isValidDocument(cliente.document),
    inscricaoEstadual: cliente.state_registration ?? null,
    email: cliente.email ?? null,
    telefone: cliente.phone ?? null,
    enderecoCompleto: enderecoPartes.length > 0 ? enderecoPartes.join(", ") : null,
    regimeTributario: cliente.tax_regime ?? null,
    responsavelLegal: cliente.primary_contact_name ?? null,
    sistemaNome: cliente.system_name ?? null,
    modulos,
    valorModulos: modulos.reduce((sum, m) => sum + m.valorTotal, 0),
    valorMensalidade: Number(cliente.monthly_value_final ?? 0),
    valorMensalidadeBase: Number(cliente.monthly_value_base ?? 0),
    diaVencimento: cliente.default_due_day ?? null,
    dataInicioContrato: cliente.contract_start_at ?? null,
    indiceReajuste: cliente.adjustment_type ?? null,
    percentualReajuste:
      cliente.adjustment_percent === null || cliente.adjustment_percent === undefined
        ? null
        : Number(cliente.adjustment_percent),
    camposFaltantes: [],
  };

  const faltantes: string[] = [];
  if (!extraction.nome) faltantes.push("Nome do cliente");
  if (!extraction.documento) faltantes.push("CNPJ/CPF");
  else if (!extraction.documentoValido) faltantes.push("CNPJ/CPF inválido");
  if (!extraction.valorMensalidade) faltantes.push("Valor da mensalidade");
  extraction.camposFaltantes = faltantes;

  return extraction;
}

/** Converte a extração no mapa de placeholders `{{variavel}}` do template. */
export function buildTemplateBindings(data: ContractExtraction): Record<string, string> {
  const brl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return {
    cliente_nome: data.nome ?? "",
    cliente_razao_social: data.razaoSocial ?? data.nome ?? "",
    cliente_nome_fantasia: data.nomeFantasia ?? data.nome ?? "",
    cliente_cnpj: data.documentoFormatado ?? "",
    cliente_ie: data.inscricaoEstadual ?? "ISENTO",
    cliente_email: data.email ?? "",
    cliente_telefone: data.telefone ?? "",
    cliente_endereco: data.enderecoCompleto ?? "",
    cliente_regime_tributario: data.regimeTributario ?? "",
    cliente_responsavel: data.responsavelLegal ?? "",
    sistema_nome: data.sistemaNome ?? "",
    modulos_lista:
      data.modulos.length > 0
        ? data.modulos
            .map((m) => `${m.nome} (x${m.quantidade}) — ${brl(m.valorTotal)}`)
            .join("; ")
        : "Nenhum módulo adicional",
    valor_mensalidade: brl(data.valorMensalidade),
    valor_mensalidade_base: brl(data.valorMensalidadeBase),
    dia_vencimento: data.diaVencimento ? String(data.diaVencimento) : "",
    data_inicio_contrato: data.dataInicioContrato
      ? new Date(data.dataInicioContrato).toLocaleDateString("pt-BR")
      : "",
    indice_reajuste: data.indiceReajuste ?? "",
    percentual_reajuste:
      data.percentualReajuste !== null ? `${data.percentualReajuste}%` : "",
  };
}

/** Aplica os bindings ao corpo do template, preservando placeholders desconhecidos. */
export function renderTemplate(body: string, bindings: Record<string, string>): string {
  return body.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (match, key: string) => {
    const value = bindings[key.toLowerCase()];
    return value !== undefined && value !== "" ? value : match;
  });
}

export const contractTemplatesService = {
  async list(): Promise<ContractTemplate[]> {
    const { data, error } = await supabase
      .from("contract_templates" as any)
      .select("*")
      .is("deleted_at", null)
      .order("is_default", { ascending: false })
      .order("name");

    if (error) {
      logger.error("Erro ao listar templates de contrato", error);
      throw error;
    }

    return ((data ?? []) as any[]).map((t) => ({
      ...t,
      variables: Array.isArray(t.variables) ? t.variables : [],
    })) as ContractTemplate[];
  },

  async getDefault(): Promise<ContractTemplate | null> {
    const templates = await this.list();
    return templates.find((t) => t.is_default && t.active) ?? templates[0] ?? null;
  },

  async save(
    template: Partial<ContractTemplate> & { id?: string },
  ): Promise<boolean> {
    const payload = {
      name: template.name,
      description: template.description ?? null,
      category: template.category ?? "saas",
      body: template.body,
      variables: template.variables ?? CONTRACT_VARIABLES,
      ai_instructions: template.ai_instructions ?? null,
      is_default: template.is_default ?? false,
      active: template.active ?? true,
    };

    if (template.id) {
      const { error } = await supabase
        .from("contract_templates" as any)
        .update(payload as any)
        .eq("id", template.id);
      if (error) {
        logger.error("Erro ao atualizar template de contrato", error);
        return false;
      }
      return true;
    }

    const { error } = await supabase
      .from("contract_templates" as any)
      .insert(payload as any);
    if (error) {
      logger.error("Erro ao criar template de contrato", error);
      return false;
    }
    return true;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("contract_templates" as any)
      .update({ deleted_at: new Date().toISOString(), active: false } as any)
      .eq("id", id);
    if (error) {
      logger.error("Erro ao excluir template de contrato", error);
      return false;
    }
    return true;
  },
};
