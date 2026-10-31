import { airlineBookingLink } from "@/lib/airlineSites";
import { isIndianAirport } from "@/lib/airports";
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

// Another site to check, for flights where Google lists only the airline. A search link, so no price is shown.
export function cleartripLink(flight: Flight): OutboundLink | null {
  const first = flight.segments[0];
  const last = flight.segments[flight.segments.length - 1];
  if (!isIndianAirport(first.from) || !isIndianAirport(last.to)) return null;
  const party = flight.travelers ?? SOLO;
  return {
    label: "Cleartrip",
    seller: "Cleartrip",
    href: `/api/out?${new URLSearchParams({
      type: "flight",
      vendor: "cleartrip",
      from: first.from.code,
      to: last.to.code,
      date: first.departureTime.slice(0, 10),
      airline: first.airline,
      cabin: flight.cabinClass,
      adults: String(party.adults),
      children: String(party.children),
      infants: String(party.infants),
    })}`,
  };
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
