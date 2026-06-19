import type {
  ContaBancaria,
  PlanoContas,
  TituloFinanceiro,
  MovimentoBancario,
  ConfigFinanceira,
} from "@/types/financeiro";

export const defaultConfigFinanceira: ConfigFinanceira = {
  diasAlerta: 7,
  diasSuspensao: 30,
  contaBancariaPadraoId: "",
  periodoPadraoRelatorio: "12m",
  custoPorSistema: {
    "PDV+": 0,
    "LinkPro": 0,
    "Torge": 0,
    "Emissor Fiscal": 0,
    "Hyon Hospede": 0,
  },
};

export function dbToConta(r: any): ContaBancaria {
  return {
    id: r.id,
    nome: r.bank_name || "",
    banco: r.bank_code || "",
    agencia: r.agency || "",
    conta: r.account || "",
    tipoConta: (r.account_type as any) || "corrente",
    saldoInicial: 0,
    ativo: true,
  };
}

export function dbToPlanoContas(r: any): PlanoContas {
  return {
    id: r.id,
    codigo: r.code,
    nome: r.name,
    tipo: r.type as any,
    paiId: r.parent_id,
    ativo: r.active,
  };
}

export function dbToTitulo(r: any): TituloFinanceiro {
  const m = r.metadata || {};
  return {
    id: r.id,
    tipo: r.type as any,
    origem: (r.origin || "outro") as any,
    clienteId: r.client_id,
    fornecedorNome: r.supplier_name || null,
    descricao: r.description,
    categoriaPlanoContasId: r.plan_account_code || "",
    competenciaMes: r.competency || "",
    dataEmissao: r.issued_at || r.created_at,
    vencimento: r.due_at || "",
    valorOriginal: Number(r.value_original) || 0,
    desconto: Number(r.discount) || 0,
    juros: Number(r.interest) || 0,
    multa: Number(r.fine) || 0,
    status: r.status as any,
    formaPagamento: (m.formaPagamento || "boleto") as any,
    contaBancariaId: r.bank_account_id,
    anexosFake: m.anexosFake || [],
    observacoes: r.notes || "",
    commissionType: r.commission_type || null,
    isCourtesy: r.is_courtesy || false,
    courtesyReason: r.courtesy_reason || null,
    criadoEm: r.created_at,
    atualizadoEm: r.updated_at,
  };
}

export function dbToMovimento(r: any): MovimentoBancario {
  return {
    id: r.id,
    contaBancariaId: r.bank_account_id,
    data: r.date,
    descricao: r.description,
    valor: Number(r.value) || 0,
    tipo: r.type as any,
    conciliado: r.reconciled,
    tituloVinculadoId: r.linked_title_id,
    categoriaSugestao: null,
    criadoEm: r.created_at,
  };
}
