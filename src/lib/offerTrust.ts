import type { FlightOffer } from "@/types/flight";

// Some sellers tell Google a price far below everyone else (BLR-GOP, 3 adults: Kiwi.com listed Rs52,984
// against the airline's Rs79,902, then asked Rs90,233 at its own checkout). They stay in price order, but
// the panel warns about them and recommends the cheapest of the other sellers.
const FAR_BELOW_RATIO = 0.75;

// Prices under this get the note, or null when the list gives no reason for one.
// Two signals: well under the airline's own price, or a smaller group sitting well below a gap
// under the cheapest of the main group.
export function farBelowLimit(offers: FlightOffer[], airline: string): number | null {
  const prices = offers.map((o) => o.price).sort((a, b) => a - b);
  let limit: number | null = null;
  const own = offers.find((o) => o.seller.toLowerCase() === airline.toLowerCase());
  // Only when another seller is close to it and most sellers sit above the cut-off, so an airline listing
  // a pricier fare type (perhaps with one agent copying it) does not single out the cheaper majority.
  if (own && offers.some((o) => o !== own && Math.abs(o.price - own.price) <= own.price * 0.1)) {
    const cutoff = own.price * FAR_BELOW_RATIO;
    const below = prices.filter((p) => p < cutoff).length;
    if (below < prices.length - below) limit = cutoff;
  }
  if (prices.length >= 3) {
    // The widest gap counts only when more sellers sit above it than below (a tie proves nothing).
    let best = 0;
    for (let k = 1; k < prices.length; k++) {
      if (k < prices.length - k && prices[k - 1] < prices[k] * FAR_BELOW_RATIO && (!best || prices[k] / prices[k - 1] > prices[best] / prices[best - 1])) {
        best = k;
      }
    }
    if (best) limit = Math.max(limit ?? 0, prices[best - 1] + 1);
  }
  return limit;
}

// Cheapest first, plus the offers far below the rest that get a warning and are not recommended.
export function rankOffers(offers: FlightOffer[], airline: string): { offers: FlightOffer[]; farBelow: Set<FlightOffer> } {
  const limit = farBelowLimit(offers, airline);
  return {
    offers: [...offers].sort((a, b) => a.price - b.price),
    farBelow: new Set(limit === null ? [] : offers.filter((o) => o.price < limit)),
  };
}
