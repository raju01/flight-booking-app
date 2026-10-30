import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — compare flight fares`,
    short_name: SITE_NAME,
    description: "Compare flight fares across airlines and booking sites, cheapest first.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9ff",
    theme_color: "#4f46e5",
  };
}
