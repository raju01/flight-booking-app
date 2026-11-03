import { FlightOffer } from "@/types/flight";
import { getJSON, setJSON } from "@/lib/sharedStore";

// Google's list of sellers for one flight comes and goes during the day: the same flight can show a dozen
// booking sites at noon and only the airline an hour later. So the fullest list seen recently is remembered
// and shown, clearly labelled with when it was fetched, whenever a newer lookup finds fewer sellers.
//
// Remembered lists live in the shared store (see sharedStore.ts), so every server instance sees them.

const TTL_SECONDS = Number(process.env.OFFERS_MEMORY_TTL_SECONDS) || 3 * 60 * 60;

interface Remembered {
  at: number;
  offers: FlightOffer[];
}

export interface RememberedOffers {
  offers: FlightOffer[];
  asOf: string; // when these sellers were fetched
  stale: boolean; // true when a newer lookup found fewer sellers and this older list is shown instead
}

async function load(key: string): Promise<Remembered | null> {
  const found = await getJSON<Remembered>(key);
  return found && Date.now() - found.at < TTL_SECONDS * 1000 ? found : null;
}

function save(key: string, value: Remembered): Promise<void> {
  return setJSON(key, value, TTL_SECONDS);
}

// Decides what to show: the fresh list when it is at least as full as what we remember (and remembers it),
// otherwise the fuller remembered list. `fresh` is null when the lookup itself failed.
export async function reconcileOffers(key: string, fresh: FlightOffer[] | null): Promise<RememberedOffers | null> {
  const previous = await load(key);

  if (fresh && fresh.length > 0 && (!previous || fresh.length >= previous.offers.length)) {
    const at = Date.now();
    await save(key, { at, offers: fresh });
    return { offers: fresh, asOf: new Date(at).toISOString(), stale: false };
  }
  if (previous && (!fresh || fresh.length < previous.offers.length)) {
    return { offers: previous.offers, asOf: new Date(previous.at).toISOString(), stale: true };
  }
  return fresh ? { offers: fresh, asOf: new Date().toISOString(), stale: false } : null;
}
