import { findAirport, isIndianAirport } from "@/lib/airports";
import { SOLO } from "@/lib/party";
import { redbusCity } from "@/lib/redbusCities";
import { TravelerCounts } from "@/types/traveler";

// Server only. The Cuelinks channel id and tracker template are private env vars, so this module
// must not be imported from a client component. Browsers reach it through /api/out.

// Cuelinks pays only when the click hits linksredirect.com and the destination is an
// approved campaign. Airline sites and Google Flights are not campaigns, so they are not wrapped.
const CUELINKS_MERCHANT_HOSTS = ["makemytrip.com", "redbus.in", "cleartrip.com", "goibibo.com"];

// Off unless AFFILIATE_ENABLED=true, so a pending or rejected channel cannot break the Book buttons.
function affiliateTemplate(): string | undefined {
  if (process.env.AFFILIATE_ENABLED?.trim().toLowerCase() !== "true") return undefined;
  const explicit = process.env.AFFILIATE_LINK_TEMPLATE?.trim();
  if (explicit?.includes("{url}")) return explicit;
  const channelId = process.env.CUELINKS_CHANNEL_ID?.trim();
  if (!channelId) return undefined;
  return `https://linksredirect.com/?cid=${encodeURIComponent(channelId)}&source=linkkit&url={url}`;
}

function isCuelinksMerchant(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return CUELINKS_MERCHANT_HOSTS.some((merchant) => host === merchant || host.endsWith(`.${merchant}`));
  } catch {
    return false;
  }
}

// Wraps a paying merchant URL with the Cuelinks tracker. Other URLs are returned unchanged.
export function withAffiliate(url: string): string {
  const template = affiliateTemplate();
  if (!template?.includes("{url}") || !isCuelinksMerchant(url)) return url;
  const prefix = template.slice(0, template.indexOf("{url}"));
  if (prefix && url.startsWith(prefix)) return url;
  return template.replaceAll("{url}", encodeURIComponent(url));
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => encodeURIComponent(values[key] ?? ""));
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// MakeMyTrip Flights is a Cuelinks campaign (paid per click). The search URL is the deeplink.
function makeMyTripSearchUrl(
  from: string,
  to: string,
  date: string,
  cabinClass: string,
  travelers: TravelerCounts
): string {
  // MakeMyTrip uses a different search for flights that leave India or arrive from abroad.
  const international = !isIndianAirport(findAirport(from)) || !isIndianAirport(findAirport(to));
  const [year, month, day] = date.split("-");
  const cabin =
    cabinClass === "Business" || cabinClass === "First"
      ? "B"
      : cabinClass === "Premium Economy"
        ? "W"
        : "E";
  const query = new URLSearchParams({
    tripType: "O",
    paxType: `A-${travelers.adults}_C-${travelers.children}_I-${travelers.infants}`,
    intl: String(international),
    cabinClass: cabin,
    ccde: "IN",
    lang: "eng",
  });
  return `https://www.makemytrip.com/flight/search?itinerary=${from}-${to}-${day}/${month}/${year}&${query}`;
}

export interface FlightLinkParams {
  from: string;
  to: string;
  date: string;
  airline: string;
  cabinClass: string;
  travelers?: TravelerCounts;
}

export function flightPartnerUrl(
  { from, to, date, airline, cabinClass, travelers = SOLO }: FlightLinkParams,
  track = true
): string {
  const wrap = track ? withAffiliate : (url: string) => url;
  const partnerTemplate = process.env.NEXT_PUBLIC_FLIGHT_PARTNER_URL?.trim();
  const partnerName = process.env.NEXT_PUBLIC_FLIGHT_PARTNER_NAME?.trim();
  if (partnerTemplate && partnerName) {
    return wrap(
      fill(partnerTemplate, {
        from,
        to,
        date,
        airline,
        adults: String(travelers.adults),
        children: String(travelers.children),
        infants: String(travelers.infants),
      })
    );
  }
  return wrap(makeMyTripSearchUrl(from, to, date, cabinClass, travelers));
}

const REDBUS_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function redbusOnward(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${REDBUS_MONTHS[Number(month) - 1]}-${year}`;
}

export function busPartnerUrl(bus: { from: string; to: string; date: string }, track = true): string {
  const fromCity = redbusCity(bus.from);
  const toCity = redbusCity(bus.to);
  const template = process.env.NEXT_PUBLIC_BUS_PARTNER_URL?.trim();

  let href: string;
  if (template) {
    href = fill(template, {
      from: fromCity?.name ?? bus.from,
      to: toCity?.name ?? bus.to,
      fromSlug: fromCity?.slug ?? slug(bus.from),
      toSlug: toCity?.slug ?? slug(bus.to),
      fromId: fromCity?.id ?? "",
      toId: toCity?.id ?? "",
      date: bus.date,
    });
  } else if (fromCity && toCity) {
    const query = new URLSearchParams({
      fromCityId: fromCity.id,
      fromCityName: fromCity.name,
      toCityId: toCity.id,
      toCityName: toCity.name,
      onward: redbusOnward(bus.date),
      srcCountry: "IND",
      destCountry: "IND",
    });
    href = `https://www.redbus.in/bus-tickets/${fromCity.slug}-to-${toCity.slug}?${query}`;
  } else {
    // A guessed slug is rewritten by redBus to fromCityName=undefined.
    // Only Port Blair and Agatti have no redBus city; open the homepage there.
    href = "https://www.redbus.in/";
  }

  return track ? withAffiliate(href) : href;
}

// Cuelinks sends every click to /broken-links while a channel is pending or disabled. Probe once
// and remember the answer, so users reach the merchant directly until tracking actually works.
const PROBE_TTL_OK_MS = 5 * 60_000;
const PROBE_TTL_FAIL_MS = 60_000;
let probeCache: { ok: boolean; expires: number } | undefined;

export async function trackerWorks(trackedUrl: string): Promise<boolean> {
  if (probeCache && probeCache.expires > Date.now()) return probeCache.ok;
  let ok = false;
  try {
    const res = await fetch(trackedUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(3000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SkyBook link check)" },
    });
    const location = res.headers.get("location") ?? "";
    ok = res.status >= 300 && res.status < 400 && location !== "" && !location.includes("/broken-links");
  } catch {
    ok = false;
  }
  probeCache = { ok, expires: Date.now() + (ok ? PROBE_TTL_OK_MS : PROBE_TTL_FAIL_MS) };
  return ok;
}
