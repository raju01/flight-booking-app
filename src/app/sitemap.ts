import type { MetadataRoute } from "next";
import { ROUTES, routeSlug } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/flights", "/explore", "/about", "/disclosure", "/privacy"];
  return [
    ...pages.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: path === "" ? ("daily" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.6,
    })),
    ...ROUTES.map((route) => ({
      url: `${SITE_URL}/flights/${routeSlug(route)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
