export const BAGGAGE_ADDON_OPTIONS = [0, 5, 10, 15, 20] as const;
export type BaggageAddonKg = (typeof BAGGAGE_ADDON_OPTIONS)[number];

const PRICE_PER_KG = 90;

export function baggageAddonPrice(extraKg: BaggageAddonKg): number {
  return extraKg * PRICE_PER_KG;
}
