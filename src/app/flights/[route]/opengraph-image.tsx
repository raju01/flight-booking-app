import { ImageResponse } from "next/og";
import { findAirport } from "@/lib/airports";
import { placeName, routeFromSlug } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";

export const alt = "Flight fares compared across sellers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ route: string }> }) {
  const { route: slug } = await params;
  const route = routeFromSlug(slug);
  const from = route && findAirport(route.from);
  const to = route && findAirport(route.to);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          color: "white",
          background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 55%, #d946ef 100%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, opacity: 0.9 }}>
          {SITE_NAME} · Compare fares
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 92, fontWeight: 800, lineHeight: 1.05 }}>
          {from && to ? `${placeName(from)} to ${placeName(to)}` : "Flight fares"}
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 52, fontWeight: 700, opacity: 0.9 }}>
          {route ? `${route.from} → ${route.to}` : ""}
        </div>
        <div style={{ display: "flex", marginTop: 36, fontSize: 34, opacity: 0.85 }}>
          Every airline and booking site for the same flight, cheapest first.
        </div>
      </div>
    ),
    size
  );
}
