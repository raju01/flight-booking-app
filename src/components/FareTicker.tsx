"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/currency";
import { seededRandom, seedFromString } from "@/lib/seededRandom";

interface TickerEntry {
  id: string;
  route: string;
  airline: string;
  price: number;
  direction: "up" | "down" | "flat";
}

const ROUTES: { route: string; airline: string; base: number }[] = [
  { route: "DEL → BOM", airline: "IndiGo", base: 2310 },
  { route: "BLR → DEL", airline: "Vistara", base: 3120 },
  { route: "BOM → GOI", airline: "Akasa Air", base: 1890 },
  { route: "DEL → BLR", airline: "Air India", base: 3450 },
  { route: "MAA → HYD", airline: "SpiceJet", base: 1740 },
  { route: "CCU → DEL", airline: "IndiGo", base: 3980 },
  { route: "PNQ → BOM", airline: "Air India Express", base: 1520 },
  { route: "AMD → DEL", airline: "Vistara", base: 2680 },
  { route: "COK → BOM", airline: "Akasa Air", base: 3210 },
  { route: "HYD → BLR", airline: "IndiGo", base: 1980 },
];

function buildInitialEntries(): TickerEntry[] {
  return ROUTES.map((r, i) => {
    const rand = seededRandom(seedFromString(`ticker-${r.route}-init`));
    const jitter = Math.round((rand() - 0.5) * 200);
    return {
      id: `${r.route}-${i}`,
      route: r.route,
      airline: r.airline,
      price: r.base + jitter,
      direction: jitter > 20 ? "up" : jitter < -20 ? "down" : "flat",
    };
  });
}

export default function FareTicker() {
  const [entries, setEntries] = useState<TickerEntry[]>(buildInitialEntries);

  useEffect(() => {
    const interval = setInterval(() => {
      setEntries((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        const entry = prev[idx];
        const changePercent = (Math.random() - 0.5) * 0.08;
        const newPrice = Math.max(900, Math.round((entry.price * (1 + changePercent)) / 10) * 10);
        const direction = newPrice > entry.price ? "up" : newPrice < entry.price ? "down" : "flat";
        const copy = [...prev];
        copy[idx] = { ...entry, price: newPrice, direction };
        return copy;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const loopEntries = [...entries, ...entries];

  return (
    <div className="overflow-hidden border-y border-white/15 bg-black/10">
      <div className="marquee-track flex w-max">
        {loopEntries.map((entry, i) => (
          <div
            key={`${entry.id}-${i}`}
            className="flex items-center gap-2 px-6 py-2.5 text-sm text-white/90 whitespace-nowrap border-r border-white/10"
          >
            <span className="font-semibold">{entry.route}</span>
            <span className="text-white/50">·</span>
            <span className="text-white/70">{entry.airline}</span>
            <span className="font-bold">{formatPrice(entry.price)}</span>
            <span
              className={
                entry.direction === "up"
                  ? "text-rose-300"
                  : entry.direction === "down"
                    ? "text-emerald-300"
                    : "text-white/40"
              }
            >
              {entry.direction === "up" ? "▲" : entry.direction === "down" ? "▼" : "–"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
