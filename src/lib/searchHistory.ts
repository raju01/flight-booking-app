import { CabinClass } from "@/types/flight";
import { SearchHistoryEntry } from "@/types/searchHistory";

const STORAGE_KEY = "skybook_search_history";
const MAX_ENTRIES = 6;

export function loadSearchHistory(): SearchHistoryEntry[] {
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

export function addSearchHistoryEntry(entry: {
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
  tripType: "one-way" | "round-trip";
}) {
  const id = `${entry.from}-${entry.to}-${entry.tripType}`;
  const record: SearchHistoryEntry = { ...entry, id, searchedAt: new Date().toISOString() };
  const existing = loadSearchHistory().filter((e) => e.id !== id);
  const next = [record, ...existing].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — history just won't persist
  }
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
