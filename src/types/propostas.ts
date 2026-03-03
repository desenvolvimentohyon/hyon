export type SistemaProposta = "HYON" | "LINKPRO" | "OUTRO";
export type FluxoPagamento = "a_vista" | "parcelado";
export type StatusVisualizacao = "nao_enviado" | "enviado" | "visualizado" | "nao_abriu";
export type StatusAceite = "pendente" | "aceitou" | "recusou";
export type FormaEnvio = "whatsapp" | "email" | "manual_link";

export interface PropostaItem {
  id: string;
  descricao: string;
  quantidade: number;
  valor: number;
}

export interface PropostaHistorico {
  id: string;
  acao: string;
  detalhes: string;
  criadoEm: string;
}

export interface Proposta {
  id: string;
  numeroProposta: string;
  clienteId: string | null;
  clienteNomeSnapshot: string;
  sistema: SistemaProposta;
  planoNome: string;
  valorMensalidade: number;
  valorImplantacao: number;
  fluxoPagamentoImplantacao: FluxoPagamento;
  parcelasImplantacao: number | null;
  dataEnvio: string | null;
  validadeDias: number;
  dataValidade: string | null;
  statusCRM: string;
  statusVisualizacao: StatusVisualizacao;
  statusAceite: StatusAceite;
  linkAceite: string;
  pdfGeradoEm: string | null;
  observacoesInternas: string;
  informacoesAdicionais: string;
  itens: PropostaItem[];
  historico: PropostaHistorico[];
  criadoEm: string;
  atualizadoEm: string;
  partnerId: string | null;
  partnerCommissionPercent: number | null;
  partnerCommissionValue: number | null;
  commissionGenerated: boolean;
}

export interface CRMConfig {
  statusKanban: string[];
  validadePadraoDias: number;
  formaEnvioPadrao: FormaEnvio;
  mensagemPadraoEnvio: string;
  nomeEmpresa: string;
  informacoesAdicionaisPadrao: string;
  rodapePDF: string;
  corTemaPDF: string;
  exibirAssinaturaDigitalFake: boolean;
}

export const DEFAULT_CRM_CONFIG: CRMConfig = {
  statusKanban: ["Rascunho", "Enviada", "Visualizada", "Negociação", "Aceita", "Recusada"],
  validadePadraoDias: 10,
  formaEnvioPadrao: "whatsapp",
  mensagemPadraoEnvio: "Olá {cliente}, segue a proposta {numeroProposta} para o sistema {sistema}. Mensalidade: R$ {mensalidade}/mês. Implantação: R$ {implantacao}. Válida até {validade}. Acesse: {linkAceite}",
  nomeEmpresa: "GestãoTask ERP",
  informacoesAdicionaisPadrao: "Inclui suporte técnico ilimitado nos primeiros 30 dias.",
  rodapePDF: "Documento gerado automaticamente — GestãoTask ERP",
  corTemaPDF: "#2563EB",
  exibirAssinaturaDigitalFake: true,
};

export const STATUS_VISUALIZACAO_LABELS: Record<StatusVisualizacao, string> = {
  nao_enviado: "Não Enviado",
  enviado: "Enviado",
  visualizado: "Visualizado",
  nao_abriu: "Não Abriu",
};

export const STATUS_ACEITE_LABELS: Record<StatusAceite, string> = {
  pendente: "Pendente",
  aceitou: "Aceita",
  recusou: "Recusada",
};
