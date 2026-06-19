import { FINANCEIRO_COLORS } from "@/types/financeiro";

export const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtPct = (v: number) => `${v.toFixed(1)}%`;
export const C = FINANCEIRO_COLORS.raw;
