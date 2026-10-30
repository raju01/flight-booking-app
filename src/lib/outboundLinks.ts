import { airlineBookingLink } from "@/lib/airlineSites";
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
