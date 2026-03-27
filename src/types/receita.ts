export type SistemaPrincipal = string;
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

export interface MensalidadeAjuste {
  id: string;
  clienteId: string;
  data: string;
  valorAnterior: number;
  valorNovo: number;
  motivo: string;
}

export interface MetricasConfig {
  periodoPadrao: "30d" | "90d" | "12m";
  churnWindowMeses: number;
  moeda: string;
}

// Dynamic color palette for systems
const SYSTEM_COLOR_PALETTE = [
  "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899",
  "#06b6d4", "#f97316", "#14b8a6", "#a855f7", "#e11d48",
  "#84cc16", "#6366f1", "#0ea5e9", "#d946ef", "#facc15",
];

// Cache for consistent color assignment within session
const systemColorCache = new Map<string, string>();

export function getSystemColor(name: string): string {
  if (systemColorCache.has(name)) return systemColorCache.get(name)!;
  const index = systemColorCache.size;
  const color = SYSTEM_COLOR_PALETTE[index % SYSTEM_COLOR_PALETTE.length];
  systemColorCache.set(name, color);
  return color;
}

// Reset cache (useful when systems list changes)
export function resetSystemColorCache(systemNames: string[]) {
  systemColorCache.clear();
  systemNames.forEach((name, i) => {
    systemColorCache.set(name, SYSTEM_COLOR_PALETTE[i % SYSTEM_COLOR_PALETTE.length]);
  });
}

// Color palette constants (non-system colors remain static)
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
};
