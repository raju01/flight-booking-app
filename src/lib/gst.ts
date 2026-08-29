import { CabinClass } from "@/types/flight";
import { GstBreakdown } from "@/types/gst";

const GST_RATE_BY_CABIN: Record<CabinClass, number> = {
  Economy: 0.05,
  "Premium Economy": 0.12,
  Business: 0.12,
  First: 0.12,
};

const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;

export function isValidGstin(gstin: string): boolean {
  return GSTIN_PATTERN.test(gstin.trim().toUpperCase());
}

/**
 * The fare total already includes GST (matching how airlines price tickets),
 * so this backs the tax out of the total rather than adding it on top.
 */
export function computeGstBreakdown(totalPrice: number, cabinClass: CabinClass): GstBreakdown {
  const rate = GST_RATE_BY_CABIN[cabinClass];
  const taxableValue = Math.round(totalPrice / (1 + rate));
  const totalTax = totalPrice - taxableValue;
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;

  return { taxableValue, rate, cgst, sgst, total: totalPrice };
}
