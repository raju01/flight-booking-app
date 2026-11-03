import { airlineBookingLink, isAffiliateAirline } from "@/lib/airlineSites";
import { SOLO } from "@/lib/party";
import { Flight } from "@/types/flight";

export interface OutboundLink {
  label: string;
  href: string;
  seller: string;
}

// Client safe. Partner buttons point at /api/out, which builds the tracked link on the server
// so the Cuelinks channel id never ships in the browser bundle.

export function googleFlightsSearchUrl(from: string, to: string, date: string): string {
  return `https://www.google.com/travel/flights?${new URLSearchParams({
    q: `Flights from ${from} to ${to} on ${date} one way`,
    curr: "INR",
  })}`;
}

export function flightBookingLinks(flight: Flight): { primary: OutboundLink; secondary?: OutboundLink } {
  const first = flight.segments[0];
  const last = flight.segments[flight.segments.length - 1];
  const date = first.departureTime.slice(0, 10);
  const from = first.from.code;
  const to = last.to.code;
  const airlineHref = airlineBookingLink(first.airline);
  const partnerName = process.env.NEXT_PUBLIC_FLIGHT_PARTNER_NAME?.trim();
  const hasPartner = Boolean(process.env.NEXT_PUBLIC_FLIGHT_PARTNER_URL?.trim() && partnerName);
  const seller = hasPartner ? partnerName! : "MakeMyTrip";

  const google: OutboundLink = {
    label: "View on Google Flights",
    href: flight.bookingUrl ?? googleFlightsSearchUrl(from, to, date),
    seller: "Google Flights",
  };
  const primary: OutboundLink = {
    label: `Book on ${seller}`,
    href: `/api/out?${new URLSearchParams({
      type: "flight",
      from,
      to,
      date,
      airline: first.airline,
      cabin: flight.cabinClass,
      adults: String((flight.travelers ?? SOLO).adults),
      children: String((flight.travelers ?? SOLO).children),
      infants: String((flight.travelers ?? SOLO).infants),
    })}`,
    seller,
  };
  const secondary: OutboundLink = airlineHref
    ? {
        label: hasPartner ? `Book on ${first.airline}` : `${first.airline} site`,
        href: airlineHref,
        seller: first.airline,
      }
    : google;
  return { primary, secondary };
}

// "Book on the airline / Cleartrip" buttons that go through our Cuelinks link. Those campaigns open the
// merchant's home page rather than a pre-filled search, so these sit beside the normal Book buttons.
export function directBookingLinks(flight: Flight): OutboundLink[] {
  const date = flight.segments[0].departureTime.slice(0, 10);
  const links: OutboundLink[] = [];
  const airline = flight.segments.map((s) => s.airline).find(isAffiliateAirline);
  if (airline) {
    links.push({
      label: `Book on ${airline}`,
      seller: airline,
      href: `/api/out?${new URLSearchParams({ type: "airline", airline, date })}`,
    });
  }
  links.push({
    label: "Book on Cleartrip",
    seller: "Cleartrip",
    href: `/api/out?${new URLSearchParams({ type: "merchant", name: "cleartrip", date })}`,
  });
  return links;
}

export function busBookingLink(bus: { from: string; to: string; departureTime: string }): OutboundLink {
  const seller = process.env.NEXT_PUBLIC_BUS_PARTNER_NAME?.trim() || "redBus";
  return {
    label: `Book on ${seller}`,
    href: `/api/out?${new URLSearchParams({
      type: "bus",
      from: bus.from,
      to: bus.to,
      date: bus.departureTime.slice(0, 10),
    })}`,
    seller,
  };
}
