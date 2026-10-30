import { airlineBookingLink } from "@/lib/airlineSites";
import { Flight } from "@/types/flight";

export interface OutboundLink {
  label: string;
  href: string;
  seller: string;
}

// Cuelinks pays only when the click hits linksredirect.com and the destination is an
// approved campaign. Airline sites and Google Flights are not campaigns, so they are not wrapped.
const CUELINKS_MERCHANT_HOSTS = ["makemytrip.com", "redbus.in", "cleartrip.com", "goibibo.com"];

function affiliateTemplate(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_AFFILIATE_LINK_TEMPLATE?.trim();
  if (explicit?.includes("{url}")) return explicit;
  const channelId = process.env.NEXT_PUBLIC_CUELINKS_CHANNEL_ID?.trim();
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

export function googleFlightsSearchUrl(from: string, to: string, date: string): string {
  return `https://www.google.com/travel/flights?${new URLSearchParams({
    q: `Flights from ${from} to ${to} on ${date} one way`,
    curr: "INR",
  })}`;
}

// MakeMyTrip Flights is a Cuelinks campaign (paid per click). The search URL is the deeplink.
function makeMyTripSearchUrl(from: string, to: string, date: string, cabinClass: string): string {
  const [year, month, day] = date.split("-");
  const cabin =
    cabinClass === "Business" || cabinClass === "First"
      ? "B"
      : cabinClass === "Premium Economy"
        ? "W"
        : "E";
  const query = new URLSearchParams({
    tripType: "O",
    paxType: "A-1_C-0_I-0",
    intl: "false",
    cabinClass: cabin,
    ccde: "IN",
    lang: "eng",
  });
  return `https://www.makemytrip.com/flight/search?itinerary=${from}-${to}-${day}/${month}/${year}&${query}`;
}

export function flightBookingLinks(flight: Flight): { primary: OutboundLink; secondary?: OutboundLink } {
  const first = flight.segments[0];
  const last = flight.segments[flight.segments.length - 1];
  const date = first.departureTime.slice(0, 10);
  const from = first.from.code;
  const to = last.to.code;
  const googleHref = flight.bookingUrl ?? googleFlightsSearchUrl(from, to, date);
  const airlineHref = airlineBookingLink(first.airline);
  const makeMyTripHref = withAffiliate(makeMyTripSearchUrl(from, to, date, flight.cabinClass));
  const partnerTemplate = process.env.NEXT_PUBLIC_FLIGHT_PARTNER_URL?.trim();
  const partnerName = process.env.NEXT_PUBLIC_FLIGHT_PARTNER_NAME?.trim();

  const google: OutboundLink = {
    label: "View on Google Flights",
    href: googleHref,
    seller: "Google Flights",
  };

  if (partnerTemplate && partnerName) {
    const partner: OutboundLink = {
      label: `Book on ${partnerName}`,
      href: withAffiliate(
        fill(partnerTemplate, { from, to, date, airline: first.airline })
      ),
      seller: partnerName,
    };
    return {
      primary: partner,
      secondary: airlineHref
        ? { label: `Book on ${first.airline}`, href: airlineHref, seller: first.airline }
        : google,
    };
  }

  return {
    primary: { label: "Book on MakeMyTrip", href: makeMyTripHref, seller: "MakeMyTrip" },
    secondary: airlineHref
      ? { label: `${first.airline} site`, href: airlineHref, seller: first.airline }
      : google,
  };
}

export function busBookingLink(bus: { from: string; to: string; departureTime: string }): OutboundLink {
  const date = bus.departureTime.slice(0, 10);
  const template =
    process.env.NEXT_PUBLIC_BUS_PARTNER_URL?.trim() ||
    "https://www.redbus.in/bus-tickets/{fromSlug}-to-{toSlug}";
  const seller = process.env.NEXT_PUBLIC_BUS_PARTNER_NAME?.trim() || "redBus";
  return {
    label: `Book on ${seller}`,
    href: withAffiliate(
      fill(template, {
        from: bus.from,
        to: bus.to,
        fromSlug: slug(bus.from),
        toSlug: slug(bus.to),
        date,
      })
    ),
    seller,
  };
}
