import { FlightOffer } from "@/types/flight";

// True when the seller's own description says a checked bag comes with the fare, e.g.
// "2 free checked bags" or "1st checked bag free". A priced bag ("1st checked bag: ₹1,500") is not.
export function includesCheckedBag(offer: FlightOffer): boolean {
  return (offer.baggage ?? []).some((line) => /checked bag/i.test(line) && /\b(free|included)\b/i.test(line));
}

export function baggageSummary(offer: FlightOffer): string | null {
  if (!offer.baggage?.length) return null;
  return includesCheckedBag(offer) ? "Checked bag included" : "No checked bag listed";
}
