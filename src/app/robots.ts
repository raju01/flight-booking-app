import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Search results, booking steps and the API change per visitor, so crawlers skip them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/search", "/bus-search", "/book", "/bus-book", "/manage", "/login"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
