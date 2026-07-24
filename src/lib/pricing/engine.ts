import type {
  Quote,
  QuoteInput,
  QuoteLine,
  QuoteModuleInput,
} from "./types";
import {
  DEFAULT_CYCLE_DISCOUNTS,
  applyMinValue,
  clampPct,
  cycleDiscountPct,
  cycleMultiplier,
  round2,
} from "./rules";
import { computeSetup } from "./setup";

/**
 * Preço "efetivo" de um módulo considerando bônus e desconto individual.
 */
const moduleLineTotal = (m: QuoteModuleInput): number => {
  if (m.bonus) return 0;
  const gross = Math.max(0, m.unitPrice) * Math.max(0, m.quantity);
  const disc = clampPct(m.discountPct);
  return round2(gross * (1 - disc / 100));
};

/**
 * Aplica bonificação automática: os `bonusCount` primeiros módulos EXTRAS
 * (não inclusos no plano) mais baratos viram bônus.
 * Não altera módulos com desconto explícito (respeita a decisão do operador).
 */
const applyBonusCount = (
  modules: QuoteModuleInput[],
  bonusCount: number,
): QuoteModuleInput[] => {
  if (!bonusCount || bonusCount <= 0) return modules;
  const eligibleIdx = modules
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => !m.includedInPlan && !m.bonus && !m.discountPct)
    .sort((a, b) => a.m.unitPrice - b.m.unitPrice)
    .slice(0, bonusCount)
    .map(({ i }) => i);

  const set = new Set(eligibleIdx);
  return modules.map((m, i) => (set.has(i) ? { ...m, bonus: true } : m));
};

/**
 * Função pura de precificação. Determinística e sem I/O.
 */
export const computeQuote = (input: QuoteInput): Quote => {
  const cycle = input.cycle ?? "monthly";
  const plan = input.plan ?? null;

  const discounts =
    plan?.cycleDiscounts ??
    input.defaultCycleDiscounts ??
    DEFAULT_CYCLE_DISCOUNTS;

  // 1) Bonificação automática
  const bonusCount = Math.max(0, plan?.bonusCount ?? 0);
  const modulesWithBonus = applyBonusCount(input.modules ?? [], bonusCount);

  // 2) Linhas
  const lines: QuoteLine[] = [];
  if (plan) {
    lines.push({
      id: `plan:${plan.id}`,
      label: plan.name,
      unitPrice: round2(plan.basePrice),
      quantity: 1,
      total: round2(Math.max(0, plan.basePrice)),
      kind: "plan",
    });
  }

  for (const m of modulesWithBonus) {
    const total = moduleLineTotal(m);
    const kind: QuoteLine["kind"] = m.bonus
      ? "module-bonus"
      : m.includedInPlan
        ? "module-included"
        : "module-extra";
    lines.push({
      id: `mod:${m.id}`,
      label: m.name,
      unitPrice: round2(m.unitPrice),
      quantity: m.quantity,
      total,
      kind,
      note:
        m.bonus
          ? "Bônus"
          : m.includedInPlan
            ? "Incluso no plano"
            : m.discountPct
              ? `${clampPct(m.discountPct)}% off${m.discountReason ? ` — ${m.discountReason}` : ""}`
              : undefined,
    });
  }

  // 3) Subtotal (soma de todas as linhas)
  const subtotal = round2(lines.reduce((acc, l) => acc + l.total, 0));

  // 4) Valor mínimo do plano
  const afterMin = round2(applyMinValue(subtotal, plan?.minValue));
  const minValueApplied = afterMin > subtotal;

  // 5) Desconto global adicional
  const globalDisc = clampPct(input.globalDiscountPct);
  const monthlyBase = round2(afterMin * (1 - globalDisc / 100));

  // 6) Ciclo
  const mult = cycleMultiplier(cycle);
  const cycleDisc = cycleDiscountPct(cycle, discounts);
  const monthlyAfterCycleDiscount = round2(monthlyBase * (1 - cycleDisc / 100));
  const cycleTotal = round2(monthlyAfterCycleDiscount * mult);
  const savingsVsMonthly = round2(monthlyBase * mult - cycleTotal);

  // 7) Setup
  const setup = computeSetup(input.setup);

  // 8) Total no primeiro ciclo
  const firstChargeTotal = round2(cycleTotal + setup.total);

  return {
    lines,
    subtotal,
    monthlyBase,
    cycle,
    cycleMultiplier: mult,
    cycleDiscountPct: cycleDisc,
    monthlyAfterCycleDiscount,
    cycleTotal,
    savingsVsMonthly,
    setup,
    firstChargeTotal,
    applied: {
      minValueApplied,
      bonusModulesCount: modulesWithBonus.filter((m) => m.bonus).length,
      globalDiscountPct: globalDisc,
    },
  };
};
