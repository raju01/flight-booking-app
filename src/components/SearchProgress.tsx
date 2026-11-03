"use client";

import { useEffect, useState } from "react";
import { HotelIcon, PlaneIcon } from "@/components/icons";

// Shown while a live search runs. The first search for a route asks Google for fresh prices, which can
// take 10-20 seconds, so say what is happening instead of showing blank boxes.
const STEPS = {
  flights: [
    [0, "Searching live fares on Google Flights…"],
    [3, "Checking airlines and booking sites…"],
    [7, "Comparing prices to find the cheapest…"],
    [12, "Almost there. Live searches can take up to 20 seconds."],
    [25, "Still working. Google is slow to answer right now."],
  ],
  hotels: [
    [0, "Searching live hotel prices on Google Hotels…"],
    [3, "Checking hotels and holiday homes…"],
    [7, "Sorting stays by price…"],
    [12, "Almost there. Live searches can take up to 20 seconds."],
    [25, "Still working. Google is slow to answer right now."],
  ],
} as const;

const THEME = {
  flights: { Icon: PlaneIcon, bar: "from-indigo-500 to-fuchsia-500", icon: "text-indigo-600 bg-indigo-50", border: "border-indigo-100" },
  hotels: { Icon: HotelIcon, bar: "from-amber-500 to-orange-500", icon: "text-orange-600 bg-orange-50", border: "border-amber-100" },
} as const;

export default function SearchProgress({ kind = "flights" }: { kind?: keyof typeof STEPS }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const steps = STEPS[kind];
  const message = [...steps].reverse().find(([at]) => seconds >= at)?.[1] ?? steps[0][1];
  // Eases towards 95% over about 20 seconds; it never claims to be finished.
  const percent = Math.min(95, Math.round(95 * (1 - Math.exp(-seconds / 7))));
  const { Icon, bar, icon, border } = THEME[kind];

  return (
    <div role="status" aria-live="polite" className={`mb-3 rounded-2xl border ${border} bg-white p-4 sm:p-5 shadow-sm`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${icon}`}>
          <Icon className="h-5 w-5 animate-bounce" />
        </span>
        <div className="min-w-0">
          <p className="font-bold text-slate-900">{message}</p>
          <p className="text-xs text-slate-500">
            We fetch live prices, so the first search for a route can take a few seconds. Repeat searches are faster.
          </p>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full bg-gradient-to-r ${bar} transition-[width] duration-1000 ease-out`} style={{ width: `${Math.max(percent, 5)}%` }} />
      </div>
    </div>
  );
}
