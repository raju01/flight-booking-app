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
  Emirates: "https://www.emirates.com",
  "Qatar Airways": "https://www.qatarairways.com",
  "Etihad": "https://www.etihad.com",
  "Singapore Airlines": "https://www.singaporeair.com",
  Scoot: "https://www.flyscoot.com",
  "Malaysia Airlines": "https://www.malaysiaairlines.com",
  AirAsia: "https://www.airasia.com",
  "Thai Airways": "https://www.thaiairways.com",
  "Vietnam Airlines": "https://www.vietnamairlines.com",
  "Cathay Pacific": "https://www.cathaypacific.com",
  Lufthansa: "https://www.lufthansa.com",
  "British Airways": "https://www.britishairways.com",
  "Virgin Atlantic": "https://www.virginatlantic.com",
  "Air France": "https://www.airfrance.com",
  KLM: "https://www.klm.com",
  "Turkish Airlines": "https://www.turkishairlines.com",
  "Swiss": "https://www.swiss.com",
  Finnair: "https://www.finnair.com",
  "Saudia": "https://www.saudia.com",
  "Oman Air": "https://www.omanair.com",
  "Gulf Air": "https://www.gulfair.com",
  "Air Arabia": "https://www.airarabia.com",
  flydubai: "https://www.flydubai.com",
  SriLankan: "https://www.srilankan.com",
  "Korean Air": "https://www.koreanair.com",
  Qantas: "https://www.qantas.com",
  "United": "https://www.united.com",
  "American": "https://www.aa.com",
  Delta: "https://www.delta.com",
  "Air Canada": "https://www.aircanada.com",
};

export function airlineSite(airline: string): string | undefined {
  return AIRLINE_SITES[airline];
}

// Airline sites are not Cuelinks campaigns, so these stay as direct links.
export function airlineBookingLink(airline: string): string | undefined {
  return airlineSite(airline);
}
