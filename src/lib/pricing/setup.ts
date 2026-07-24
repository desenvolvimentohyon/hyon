import type {
  OrgSetupDefaults,
  QuoteSetupInput,
  SetupQuote,
  SystemSetupPricing,
} from "./types";
import { round2 } from "./rules";

/**
 * Cálculo de implantação:
 *   distance  = distanceKm × costPerKm
 *   labor     = days × dailyRate
 *   region    = regionBase
 *   systemFee = taxa fixa do sistema (override)
 *   total     = distance + region + labor + systemFee
 */
export const computeSetup = (input?: QuoteSetupInput): SetupQuote => {
  const distanceKm = Math.max(0, input?.distanceKm ?? 0);
  const costPerKm = Math.max(0, input?.costPerKm ?? 0);
  const days = Math.max(0, input?.days ?? 0);
  const dailyRate = Math.max(0, input?.dailyRate ?? 0);
  const regionBase = Math.max(0, input?.regionBase ?? 0);
  const systemFee = Math.max(0, input?.systemFee ?? 0);

  const distance = round2(distanceKm * costPerKm);
  const labor = round2(days * dailyRate);
  const region = round2(regionBase);
  const total = round2(distance + region + labor + systemFee);

  return {
    distance,
    region,
    labor,
    systemFee: round2(systemFee),
    total,
    systemLabel: input?.systemLabel,
  };
};

/**
 * Resolve os parâmetros de implantação aplicáveis considerando:
 *   1) override do sistema (quando ativo);
 *   2) padrões globais da empresa como fallback.
 *
 * Mantém valores explicitamente fornecidos pelo usuário (ex.: distância digitada).
 */
export const resolveSetupInput = (
  base: QuoteSetupInput,
  system: SystemSetupPricing | null | undefined,
  orgDefaults: OrgSetupDefaults,
): QuoteSetupInput => {
  const useOverride = !!system?.override;
  const costPerKm = useOverride
    ? system!.costPerKm
    : orgDefaults.costPerKm;
  const dailyRate = useOverride
    ? system!.dailyRate
    : orgDefaults.dailyRate;
  const defaultDays = useOverride
    ? system!.defaultDays
    : orgDefaults.defaultDays;
  const systemFee = useOverride ? system!.baseFee : 0;

  return {
    ...base,
    costPerKm: base.costPerKm ?? costPerKm,
    dailyRate: base.dailyRate ?? dailyRate,
    days: base.days ?? defaultDays,
    systemFee,
    systemLabel: system?.systemName,
  };
};
