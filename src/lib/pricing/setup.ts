import type { QuoteSetupInput, SetupQuote } from "./types";
import { round2 } from "./rules";

/**
 * Cálculo de implantação:
 *   distance = distanceKm × costPerKm
 *   labor    = days × dailyRate
 *   region   = regionBase
 *   total    = distance + region + labor
 */
export const computeSetup = (input?: QuoteSetupInput): SetupQuote => {
  const distanceKm = Math.max(0, input?.distanceKm ?? 0);
  const costPerKm = Math.max(0, input?.costPerKm ?? 0);
  const days = Math.max(0, input?.days ?? 0);
  const dailyRate = Math.max(0, input?.dailyRate ?? 0);
  const regionBase = Math.max(0, input?.regionBase ?? 0);

  const distance = round2(distanceKm * costPerKm);
  const labor = round2(days * dailyRate);
  const region = round2(regionBase);
  const total = round2(distance + region + labor);

  return { distance, region, labor, total };
};
