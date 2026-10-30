import { NextRequest } from "next/server";
import { busPartnerUrl, flightPartnerUrl, trackerWorks } from "@/lib/outboundBooking";
import { parseTravelers } from "@/lib/party";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Redirects to the partner booking page with the Cuelinks tracker applied. The destination is
// always built from validated parameters, never taken from the query string.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const date = params.get("date") ?? "";
  if (!DATE.test(date)) return Response.json({ error: "Invalid parameters" }, { status: 400 });

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
      route: `${from}-${to}`,
      tracked: href !== plain,
    })
  );

  return new Response(null, {
    status: 302,
    headers: { Location: href, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
