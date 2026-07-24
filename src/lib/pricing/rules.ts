import type { CycleDiscounts, QuoteCycle } from "./types";

/** Arredondamento fiscal para 2 casas. */
export const round2 = (n: number): number => {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

/** Multiplicador do ciclo. */
export const cycleMultiplier = (cycle: QuoteCycle): number => {
  switch (cycle) {
    case "annual":
      return 12;
    case "quarterly":
      return 3;
    default:
      return 1;
  }
};

/** Percentual de desconto aplicado ao ciclo. */
export const cycleDiscountPct = (
  cycle: QuoteCycle,
  discounts: CycleDiscounts,
): number => {
  if (cycle === "annual") return clampPct(discounts.annual);
  if (cycle === "quarterly") return clampPct(discounts.quarterly);
  return 0;
};

export const clampPct = (n: number | undefined | null): number => {
  if (n == null || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
};

export const DEFAULT_CYCLE_DISCOUNTS: CycleDiscounts = {
  quarterly: 5,
  annual: 10,
};

/** Aplica valor mínimo: retorna o maior entre subtotal e minValue. */
export const applyMinValue = (subtotal: number, minValue?: number): number => {
  const min = Math.max(0, minValue ?? 0);
  return Math.max(subtotal, min);
};
