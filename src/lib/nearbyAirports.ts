/**
 * Curated groupings of airports serving broadly the same metro/region,
 * used to surface a cheaper nearby alternative on search results.
 */
const NEARBY_GROUPS: string[][] = [
  ["BOM", "PNQ"],
  ["DEL", "IXC", "JAI"],
  ["BLR", "HBX", "IXG"],
  ["GOI", "GOX"],
  ["MAA", "TIR", "PNY"],
  ["CCJ", "COK", "TRV"],
  ["HYD", "VGA", "VTZ"],
  ["ATQ", "IXJ", "SXR"],
  ["CJB", "MDU", "TRZ"],
];

export function nearbyAirportCodes(code: string): string[] {
  const group = NEARBY_GROUPS.find((g) => g.includes(code));
  if (!group) return [];
  return group.filter((c) => c !== code);
}
