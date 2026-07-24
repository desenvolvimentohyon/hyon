/**
 * Tipos do motor de precificação.
 * Fonte única da verdade para landing, checkout interno,
 * cadastro de cliente e configurações de planos.
 */

export type QuoteCycle = "monthly" | "quarterly" | "annual";

export interface CycleDiscounts {
  /** Percentual de desconto no trimestral (ex.: 5 = 5%). */
  quarterly: number;
  /** Percentual de desconto no anual (ex.: 10 = 10%). */
  annual: number;
}

export interface QuoteModuleInput {
  id: string;
  name: string;
  /** Preço unitário mensal do módulo. */
  unitPrice: number;
  quantity: number;
  /** Se true, o módulo é considerado bônus/incluso e não soma. */
  bonus?: boolean;
  /** Se true, faz parte do combo do plano (informativo). */
  includedInPlan?: boolean;
  /** Desconto individual em percentual (0-100). */
  discountPct?: number;
  /** Justificativa opcional para cortesia/desconto. */
  discountReason?: string;
}

export interface QuotePlanInput {
  id: string;
  name: string;
  /** Preço base do plano (sem módulos extras). */
  basePrice: number;
  /** Valor mínimo obrigatório da mensalidade final. */
  minValue?: number;
  /** Nº de módulos gratuitos inclusos como bônus. */
  bonusCount?: number;
  /** Descontos por ciclo (fallback: proposal_settings.default). */
  cycleDiscounts?: CycleDiscounts;
  recommended?: boolean;
}

export interface QuoteSetupInput {
  /** Distância em km. */
  distanceKm?: number;
  /** Custo por km. */
  costPerKm?: number;
  /** Nº de dias em campo. */
  days?: number;
  /** Diária do técnico. */
  dailyRate?: number;
  /** Custo fixo da região. */
  regionBase?: number;
}

export interface QuoteInput {
  plan?: QuotePlanInput | null;
  modules: QuoteModuleInput[];
  cycle: QuoteCycle;
  setup?: QuoteSetupInput;
  /** Desconto global adicional em percentual (0-100). */
  globalDiscountPct?: number;
  /** Fallback quando o plano não define cycleDiscounts. */
  defaultCycleDiscounts?: CycleDiscounts;
}

export interface QuoteLine {
  id: string;
  label: string;
  unitPrice: number;
  quantity: number;
  /** total = unitPrice × quantity × (1 - discountPct/100) — 0 se bônus. */
  total: number;
  kind: "plan" | "module-included" | "module-bonus" | "module-extra";
  note?: string;
}

export interface SetupQuote {
  distance: number;
  region: number;
  labor: number;
  total: number;
}

export interface Quote {
  lines: QuoteLine[];
  /** Soma bruta dos itens (antes de mínimo/ciclo/desconto global). */
  subtotal: number;
  /** Valor após aplicar valor mínimo do plano. */
  monthlyBase: number;
  /** Ciclo escolhido. */
  cycle: QuoteCycle;
  /** Multiplicador do ciclo: 1, 3 ou 12. */
  cycleMultiplier: number;
  /** Percentual de desconto aplicado ao ciclo. */
  cycleDiscountPct: number;
  /** Valor final da mensalidade após desconto do ciclo. */
  monthlyAfterCycleDiscount: number;
  /** Valor total da parcela do ciclo (mensalidade × multiplicador). */
  cycleTotal: number;
  /** Economia anualizada versus pagar mensal. */
  savingsVsMonthly: number;
  /** Setup/implantação. */
  setup: SetupQuote;
  /** Total a pagar no primeiro ciclo (parcela + setup). */
  firstChargeTotal: number;
  /** Diagnóstico das regras aplicadas (para transparência). */
  applied: {
    minValueApplied: boolean;
    bonusModulesCount: number;
    globalDiscountPct: number;
  };
}
