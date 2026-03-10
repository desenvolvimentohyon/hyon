export type Prioridade = "baixa" | "media" | "alta" | "urgente";
export type StatusTarefa = "backlog" | "a_fazer" | "em_andamento" | "aguardando_cliente" | "concluida" | "cancelada";
export type TipoOperacional = "comercial" | "implantacao" | "suporte" | "treinamento" | "financeiro" | "interno";
export type SistemaRelacionado = string;
export type ModuloRelacionado = "estoque" | "fiscal" | "financeiro" | "relatorios";
export type StatusComercial = "lead" | "proposta_enviada" | "em_negociacao" | "fechado" | "perdido";
export type SetorTreinamento = "venda" | "comercial" | "administrativo";
export type PerfilCliente = "conservador" | "resistente" | "estrategico";
export type StatusFinanceiro = "em_dia" | "1_atraso" | "2_mais_atrasos";

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  documento?: string;
  observacoes?: string;
  criadoEm: string;
  // Perfil técnico
  sistemaUsado?: SistemaRelacionado;
  usaCloud?: boolean;
  usaTEF?: boolean;
  usaPagamentoIntegrado?: boolean;
  tipoNegocio?: string;
  perfilCliente?: PerfilCliente;
  // Financeiro
  mensalidadeAtual?: number;
  statusFinanceiro?: StatusFinanceiro;
  riscoCancelamento?: boolean;
}

export interface Tecnico {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
}

export interface ChecklistItem {
  id: string;
  texto: string;
  concluido: boolean;
}

export interface AnexoFake {
  id: string;
  nomeArquivo: string;
  tipo: string;
  tamanho: string;
}

export interface Comentario {
  id: string;
  autorNome: string;
  texto: string;
  criadoEm: string;
}

export interface HistoricoItem {
  id: string;
  acao: string;
  detalhes: string;
  criadoEm: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  clienteId: string | null;
  responsavelId: string;
  prioridade: Prioridade;
  status: StatusTarefa;
  prazoDataHora?: string;
  criadoEm: string;
  atualizadoEm: string;
  tags: string[];
  checklist: ChecklistItem[];
  anexosFake: AnexoFake[];
  comentarios: Comentario[];
  historico: HistoricoItem[];
  tempoTotalSegundos: number;
  timerRodando: boolean;
  timerInicioTimestamp?: number;
  // Módulo operacional
  tipoOperacional: TipoOperacional;
  sistemaRelacionado?: SistemaRelacionado | null;
  moduloRelacionado?: ModuloRelacionado | null;
  slaHoras?: number;
  reincidente?: boolean;
  geraCobrancaExtra?: boolean;
  valorCobrancaExtra?: number;
  etapaImplantacao?: string;
  riscoCancelamento?: boolean;
  // Comercial
  valorProposta?: number;
  tipoPlano?: string;
  dataPrevisaoFechamento?: string;
  origemLead?: string;
  statusComercial?: StatusComercial;
  motivoPerda?: string;
  objecoes?: string;
  // Treinamento
  setorTreinamento?: SetorTreinamento;
  horasMinistradas?: number;
  participantes?: string[];
  treinamentoExtraCobrado?: boolean;
  valorTreinamentoExtra?: number;
  // Implantação parent
  implantacaoId?: string; // links subtasks to parent
}

export interface TemplateImplantacao {
  id: string;
  nome: string;
  sistemaRelacionado: SistemaRelacionado;
  etapas: { texto: string; responsavelPadraoId: string }[];
}

export interface Configuracoes {
  labelsStatus: Record<StatusTarefa, string>;
  labelsPrioridade: Record<Prioridade, string>;
  modoCompacto: boolean;
}

export const STATUS_LABELS_DEFAULT: Record<StatusTarefa, string> = {
  backlog: "Backlog",
  a_fazer: "A Fazer",
  em_andamento: "Em Andamento",
  aguardando_cliente: "Aguardando Cliente",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const PRIORIDADE_LABELS_DEFAULT: Record<Prioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const STATUS_ORDER: StatusTarefa[] = [
  "backlog", "a_fazer", "em_andamento", "aguardando_cliente", "concluida", "cancelada"
];

export const STATUS_COMERCIAL_ORDER: StatusComercial[] = [
  "lead", "proposta_enviada", "em_negociacao", "fechado", "perdido"
];

export const STATUS_COMERCIAL_LABELS: Record<StatusComercial, string> = {
  lead: "Lead",
  proposta_enviada: "Proposta Enviada",
  em_negociacao: "Em Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};
