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

// Airline sites are not Cuelinks campaigns, so these stay as direct links.
export function airlineBookingLink(airline: string): string | undefined {
  return airlineSite(airline);
}
