export type SistemaPrincipal = "PDV+" | "LinkPro" | "Torge" | "Emissor Fiscal" | "Hyon Hospede";
export type StatusCliente = "ativo" | "atraso" | "suspenso" | "cancelado";

export interface ClienteReceita {
  id: string;
  nome: string;
  documento?: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  sistemaPrincipal: SistemaPrincipal;
  statusCliente: StatusCliente;
  mensalidadeAtiva: boolean;
  valorMensalidade: number;
  dataInicio: string;
  dataCancelamento: string | null;
  motivoCancelamento: string | null;
  observacoes?: string;
  // Custos
  custoAtivo: boolean;
  valorCustoMensal: number;
  sistemaCusto: SistemaPrincipal;
}

export interface SuporteEvento {
  id: string;
  clienteId: string;
  tipo: "suporte" | "implantacao" | "treinamento";
  criadoEm: string;
  duracaoMinutos: number;
  resolvido: boolean;
}

export interface MetricasConfig {
  periodoPadrao: "30d" | "90d" | "12m";
  churnWindowMeses: number;
  moeda: string;
}

// Color palette constants
export const RECEITA_COLORS = {
  receita: "#3b82f6",     // blue-500
  custos: "#ef4444",      // red-500
  margem: "#22c55e",      // green-500
  churn: "#f97316",       // orange-500
  statusAtivo: "#8b5cf6", // violet-500
  statusAtraso: "#a78bfa", // violet-400
  statusSuspenso: "#c4b5fd", // violet-300
  statusCancelado: "#7c3aed", // violet-600
  suporte: "#06b6d4",     // cyan-500
  sistemas: {
    "PDV+": "#3b82f6",
    "LinkPro": "#8b5cf6",
    "Torge": "#f59e0b",
    "Emissor Fiscal": "#10b981",
    "Hyon Hospede": "#ec4899",
  } as Record<SistemaPrincipal, string>,
};
