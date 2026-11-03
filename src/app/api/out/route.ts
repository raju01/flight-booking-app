import { NextRequest } from "next/server";
import { busPartnerUrl, flightPartnerUrl, trackerWorks, withAffiliate } from "@/lib/outboundBooking";
import { airlineBookingLink, isAffiliateAirline } from "@/lib/airlineSites";
import { parseTravelers } from "@/lib/party";
import { CLEARTRIP_HOTELS_URL, hotelTown } from "@/lib/hotelCities";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Redirects to the partner booking page with the Cuelinks tracker applied. The destination is
// always built from validated parameters, never taken from the query string.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const date = params.get("date") ?? "";
  // A hotel link opens Cleartrip Hotels' own page, so it is the only kind without a travel date.
  if (type !== "hotel" && !DATE.test(date)) return Response.json({ error: "Invalid parameters" }, { status: 400 });

  let href: string;
  let plain: string;
  if (type === "flight") {
    const airline = params.get("airline") ?? "";
    const cabinClass = params.get("cabin") ?? "Economy";
    const valid = /^[A-Z]{3}$/.test(from) && /^[A-Z]{3}$/.test(to) && airline.length <= 60 && cabinClass.length <= 20;
    if (!valid) return Response.json({ error: "Invalid parameters" }, { status: 400 });
    const link = { from, to, date, airline, cabinClass, travelers: parseTravelers((key) => params.get(key)) };
    href = flightPartnerUrl(link);
    plain = flightPartnerUrl(link, false);
  } else if (type === "airline") {
    // Only airlines with an active Cuelinks campaign, and only their own site.
    const airline = params.get("airline") ?? "";
    const site = isAffiliateAirline(airline) ? airlineBookingLink(airline) : undefined;
    if (!site) return Response.json({ error: "Invalid parameters" }, { status: 400 });
    plain = site;
    href = withAffiliate(site);
  } else if (type === "merchant" && params.get("name") === "cleartrip") {
    plain = "https://www.cleartrip.com/flights/";
    href = withAffiliate(plain);
  } else if (type === "hotel") {
    // Cleartrip Hotels (see hotelCities.ts for why it is always the same page). The city is only logged.
    if (!hotelTown(params.get("city") ?? "")) return Response.json({ error: "Invalid parameters" }, { status: 400 });
    plain = CLEARTRIP_HOTELS_URL;
    href = withAffiliate(plain);
  } else if (type === "bus") {
    if (!from || !to || from.length > 60 || to.length > 60) {
      return Response.json({ error: "Invalid parameters" }, { status: 400 });
    }
    href = busPartnerUrl({ from, to, date });
    plain = busPartnerUrl({ from, to, date }, false);
  } else {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }

  // Untracked when no tracker is configured (href === plain) or Cuelinks is not accepting clicks.
  if (href !== plain && !(await trackerWorks(href))) href = plain;

  console.log(
    JSON.stringify({
      type: "skybook_event",
      at: new Date().toISOString(),
      event: "partner_click",
      kind: type,
      route: type === "hotel" ? params.get("city") : `${from}-${to}`,
      tracked: href !== plain,
    })
  );

  return new Response(null, {
    status: 302,
    headers: { Location: href, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
