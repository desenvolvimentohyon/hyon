export type Prioridade = "baixa" | "media" | "alta" | "urgente";
export type StatusTarefa = "backlog" | "a_fazer" | "em_andamento" | "aguardando_cliente" | "concluida" | "cancelada";

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  documento?: string;
  observacoes?: string;
  criadoEm: string;
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
