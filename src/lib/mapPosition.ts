import { seededRandom, seedFromString } from "@/lib/seededRandom";

/**
 * Deterministic, stylized (non-geographic) position for an airport code within
 * a 0-100 viewbox, used for the animated route visualization. Not real coordinates.
 */
export function stylizedPosition(code: string): { x: number; y: number } {
  const rand = seededRandom(seedFromString(`mappos-${code}`));
  return {
    x: 15 + rand() * 70,
    y: 15 + rand() * 70,
  };
}
