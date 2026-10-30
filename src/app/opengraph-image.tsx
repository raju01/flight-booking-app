import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — compare flight fares and book the cheapest`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700, opacity: 0.9 }}>{SITE_NAME}</div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 88, fontWeight: 800, lineHeight: 1.05 }}>
          Find the lowest fare, every time
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 36, opacity: 0.85 }}>
          Every airline and booking site for the same flight, cheapest first.
        </div>
      </div>
    ),
    size
  );
}
