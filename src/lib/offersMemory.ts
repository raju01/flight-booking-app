import { FlightOffer } from "@/types/flight";

// Google's list of sellers for one flight comes and goes during the day: the same flight can show a dozen
// booking sites at noon and only the airline an hour later. So the fullest list seen recently is remembered
// and shown, clearly labelled with when it was fetched, whenever a newer lookup finds fewer sellers.
//
// Remembered lists live in a shared Redis store (Upstash, or Vercel KV) when its address and token are set,
// so every server instance and restart sees them. Without one they live in this server's memory, which a
// serverless host clears whenever it recycles the instance, so the memory is only best-effort then.

const TTL_SECONDS = Number(process.env.OFFERS_MEMORY_TTL_SECONDS) || 3 * 60 * 60;
const MAX_LOCAL_ENTRIES = 1000;

interface Remembered {
  at: number;
  offers: FlightOffer[];
}

export interface RememberedOffers {
  offers: FlightOffer[];
  asOf: string; // when these sellers were fetched
  stale: boolean; // true when a newer lookup found fewer sellers and this older list is shown instead
}

const local = new Map<string, Remembered>();

function redis(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function redisCommand(command: (string | number)[]): Promise<unknown> {
  const store = redis();
  if (!store) return null;
  const res = await fetch(store.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${store.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(2500),
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  return ((await res.json()) as { result?: unknown }).result ?? null;
}

async function load(key: string): Promise<Remembered | null> {
  let found: Remembered | null = null;
  try {
    const raw = await redisCommand(["GET", key]);
    if (typeof raw === "string") found = JSON.parse(raw) as Remembered;
  } catch (error) {
    console.error("Offers memory: shared store unavailable, using server memory:", error);
  }
  found ??= local.get(key) ?? null;
  return found && Date.now() - found.at < TTL_SECONDS * 1000 ? found : null;
}

async function save(key: string, value: Remembered): Promise<void> {
  if (local.size >= MAX_LOCAL_ENTRIES) local.delete(local.keys().next().value as string);
  local.set(key, value);
  try {
    await redisCommand(["SET", key, JSON.stringify(value), "EX", TTL_SECONDS]);
  } catch (error) {
    console.error("Offers memory: could not write to the shared store:", error);
  }
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
