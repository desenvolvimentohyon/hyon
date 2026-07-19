import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata número como moeda BRL. Fonte única de verdade em todo o app. */
export const formatCurrency = (v: number | null | undefined) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Formata número como porcentagem com 1 casa decimal. */
export const formatPercent = (v: number | null | undefined) =>
  `${Number(v ?? 0).toFixed(1)}%`;
