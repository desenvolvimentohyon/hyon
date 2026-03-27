import { SistemaPrincipal } from "./receita";

// ===== Enums / Unions =====
export type TipoContaBancaria = "corrente" | "poupanca" | "investimento";
export type TipoPlanoContas = "receita" | "despesa" | "custo" | "imposto" | "repasse" | "investimento";
export type TipoTitulo = "receber" | "pagar";
export type OrigemTitulo = "mensalidade" | "implantacao" | "treinamento" | "comissao" | "repasse" | "despesa_operacional" | "imposto" | "outro";
export type StatusTitulo = "aberto" | "pago" | "parcial" | "vencido" | "cancelado";
export type FormaPagamento = "pix" | "boleto" | "cartao" | "dinheiro" | "transferencia" | "outro";
export type TipoMovimento = "credito" | "debito";
export type StatusFinanceiroCliente = "em_dia" | "atraso" | "suspenso" | "cancelado";
export type CentroCusto = "comercial" | "suporte" | "implantacao" | "administrativo";

// ===== Entidades =====
export interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: TipoContaBancaria;
  saldoInicial: number;
  ativo: boolean;
}

export interface PlanoContas {
  id: string;
  codigo: string;
  nome: string;
  tipo: TipoPlanoContas;
  paiId: string | null;
  ativo: boolean;
}

export interface TituloFinanceiro {
  id: string;
  tipo: TipoTitulo;
  origem: OrigemTitulo;
  clienteId: string | null;
  fornecedorNome: string | null;
  descricao: string;
  categoriaPlanoContasId: string;
  competenciaMes: string; // YYYY-MM
  dataEmissao: string;
  vencimento: string;
  valorOriginal: number;
  desconto: number;
  juros: number;
  multa: number;
  status: StatusTitulo;
  formaPagamento: FormaPagamento;
  contaBancariaId: string | null;
  anexosFake: { id: string; nomeArquivo: string; tipo: string }[];
  observacoes: string;
  commissionType: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface MovimentoBancario {
  id: string;
  contaBancariaId: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: TipoMovimento;
  conciliado: boolean;
  tituloVinculadoId: string | null;
  categoriaSugestao: string | null;
  criadoEm: string;
}

export interface ConfigFinanceira {
  diasAlerta: number;
  diasSuspensao: number;
  contaBancariaPadraoId: string;
  periodoPadraoRelatorio: "7d" | "30d" | "90d" | "12m";
  custoPorSistema: Record<string, number>;
}

// ===== Color Constants =====
export const FINANCEIRO_COLORS = {
  receita: "hsl(210, 80%, 55%)",      // Azul
  despesa: "hsl(0, 72%, 55%)",        // Vermelho
  lucro: "hsl(152, 60%, 40%)",        // Verde
  atraso: "hsl(38, 92%, 50%)",        // Laranja
  conciliacao: "hsl(270, 60%, 55%)",  // Roxo
  imposto: "hsl(220, 12%, 55%)",      // Cinza
  // Raw values for recharts
  raw: {
    receita: "#3b82f6",
    despesa: "#ef4444",
    lucro: "#22c55e",
    atraso: "#f97316",
    conciliacao: "#8b5cf6",
    imposto: "#6b7280",
  }
};

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  pix: "PIX",
  boleto: "Boleto",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
  outro: "Outro",
};

export const STATUS_TITULO_LABELS: Record<StatusTitulo, string> = {
  aberto: "Aberto",
  pago: "Pago",
  parcial: "Parcial",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export const ORIGEM_TITULO_LABELS: Record<OrigemTitulo, string> = {
  mensalidade: "Mensalidade",
  implantacao: "Implantação",
  treinamento: "Treinamento",
  comissao: "Comissão",
  repasse: "Repasse",
  despesa_operacional: "Despesa Operacional",
  imposto: "Imposto",
  outro: "Outro",
};
