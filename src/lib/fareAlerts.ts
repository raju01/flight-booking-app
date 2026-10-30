import { CabinClass } from "@/types/flight";
import { FareAlert } from "@/types/fareAlert";
import { TravelerCounts } from "@/types/traveler";

const STORAGE_KEY = "skybook_fare_alerts";

export function loadFareAlerts(): FareAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFareAlerts(alerts: FareAlert[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {
    // localStorage unavailable — alert just won't persist
  }
}

export function findFareAlert(
  from: string,
  to: string,
  date: string,
  cabinClass: CabinClass
): FareAlert | null {
  return (
    loadFareAlerts().find(
      (a) => a.from === from && a.to === to && a.date === date && a.cabinClass === cabinClass
    ) ?? null
  );
}

export function addFareAlert(
  from: string,
  to: string,
  date: string,
  cabinClass: CabinClass,
  savedPrice: number,
  travelers?: TravelerCounts
): FareAlert {
  const alert: FareAlert = {
    id: `${from}-${to}-${date}-${cabinClass}`,
    from,
    to,
    date,
    cabinClass,
    savedPrice,
    travelers,
    createdAt: new Date().toISOString(),
  };
  const existing = loadFareAlerts().filter((a) => a.id !== alert.id);
  saveFareAlerts([alert, ...existing]);
  return alert;
}

export function removeFareAlert(id: string) {
  saveFareAlerts(loadFareAlerts().filter((a) => a.id !== id));
}
