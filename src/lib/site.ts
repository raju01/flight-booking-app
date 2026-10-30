// Public address of the site, used for canonical links, the sitemap and social previews.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://flight-booking-app-deployment.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "SkyBook";
