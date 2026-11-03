import type { FlightOffer } from "@/types/flight";

// A seller far below everyone else is usually showing a price Google stored earlier that has since
// gone (seen: four sellers 32-40% under the airline's own fare while eight others sat within 3% of
// it). Such prices are still listed, but are not recommended or counted in "save up to".
const UNUSUALLY_LOW_RATIO = 0.75;

// Prices under this are treated as doubtful, or null when the list gives no reason to doubt any.
// Two signals: well under the airline's own price, or a smaller group sitting well below a gap
// under the cheapest of the main group (a middle price would be dragged down by that group).
export function unusuallyLowBelow(offers: FlightOffer[], airline: string): number | null {
  const prices = offers.map((o) => o.price).sort((a, b) => a - b);
  let limit: number | null = null;
  const own = offers.find((o) => o.seller.toLowerCase() === airline.toLowerCase());
  // Only when another seller is close to it and most sellers sit above the cut-off, so an airline listing
  // a pricier fare type (perhaps with one agent copying it) does not make the cheaper majority look doubtful.
  if (own && offers.some((o) => o !== own && Math.abs(o.price - own.price) <= own.price * 0.1)) {
    const cutoff = own.price * UNUSUALLY_LOW_RATIO;
    const below = prices.filter((p) => p < cutoff).length;
    if (below < prices.length - below) limit = cutoff;
  }
  if (prices.length >= 3) {
    // The widest gap counts only when more sellers sit above it than below (a tie proves nothing).
    let best = 0;
    for (let k = 1; k < prices.length; k++) {
      if (k < prices.length - k && prices[k - 1] < prices[k] * UNUSUALLY_LOW_RATIO && (!best || prices[k] / prices[k - 1] > prices[best] / prices[best - 1])) {
        best = k;
      }
    }
    if (best) limit = Math.max(limit ?? 0, prices[best - 1] + 1);
  }
  return limit;
}

// Consistent prices first (cheapest first), then the unusually low ones, so the top row is the one
// we would actually recommend.
export function rankOffers(offers: FlightOffer[], airline: string): { offers: FlightOffer[]; doubtful: Set<FlightOffer> } {
  const limit = unusuallyLowBelow(offers, airline);
  const doubtful = new Set(limit === null ? [] : offers.filter((o) => o.price < limit));
  const byPrice = [...offers].sort((a, b) => a.price - b.price);
  return {
    offers: [...byPrice.filter((o) => !doubtful.has(o)), ...byPrice.filter((o) => doubtful.has(o))],
    doubtful,
  };
}
