const AIRLINE_SITES: Record<string, string> = {
  IndiGo: "https://www.goindigo.in",
  "Air India": "https://www.airindia.com",
  "Air India Express": "https://www.airindiaexpress.com",
  Vistara: "https://www.airindia.com", // merged into Air India
  SpiceJet: "https://www.spicejet.com",
  "Akasa Air": "https://www.akasaair.com",
  "Alliance Air": "https://www.allianceair.in",
  "Star Air": "https://www.starair.in",
  Fly91: "https://www.fly91.in",
};

export function airlineSite(airline: string): string | undefined {
  return AIRLINE_SITES[airline];
}

// Paste the tracked-link format from your affiliate network into NEXT_PUBLIC_AFFILIATE_LINK_TEMPLATE,
// using {url} where the airline's address goes, e.g. https://network.example/go?id=123&url={url}
export function airlineBookingLink(airline: string): string | undefined {
  const site = airlineSite(airline);
  const template = process.env.NEXT_PUBLIC_AFFILIATE_LINK_TEMPLATE;
  if (!site || !template) return site;
  return template.replace("{url}", encodeURIComponent(site));
}
