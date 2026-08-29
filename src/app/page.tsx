"use client";

import { useState } from "react";
import SearchForm from "@/components/SearchForm";
import BusSearchForm from "@/components/BusSearchForm";
import FareTicker from "@/components/FareTicker";
import { PlaneIcon, BusIcon } from "@/components/icons";

type Mode = "flights" | "bus";

const MODES: { key: Mode; label: string; Icon: typeof PlaneIcon }[] = [
  { key: "flights", label: "Flights", Icon: PlaneIcon },
  { key: "bus", label: "Bus", Icon: BusIcon },
];

const HERO_COPY: Record<
  Mode,
  { title: string; subtitle: string; from: string; via: string; to: string }
> = {
  flights: {
    title: "Find your next flight",
    subtitle: "Search hundreds of routes and book in minutes.",
    from: "from-indigo-700",
    via: "via-violet-600",
    to: "to-fuchsia-500",
  },
  bus: {
    title: "Book your next bus",
    subtitle: "Compare operators, seat types, and prices across India.",
    from: "from-emerald-700",
    via: "via-teal-600",
    to: "to-cyan-500",
  },
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("flights");
  const hero = HERO_COPY[mode];

  return (
    <div className="flex-1 flex flex-col">
      <section
        className={`relative overflow-hidden bg-gradient-to-br ${hero.from} ${hero.via} ${hero.to} text-white transition-colors duration-500`}
      >
        <div
          className="blob absolute -top-24 -left-16 w-96 h-96 rounded-full bg-white/10 blur-3xl"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="blob absolute top-10 right-0 w-80 h-80 rounded-full bg-fuchsia-300/20 blur-3xl"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="blob absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-cyan-300/10 blur-3xl"
          style={{ animationDelay: "8s" }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-10 sm:pb-14">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-white/15 border border-white/20 rounded-full px-3 py-1 mb-4">
            Fast · Simple · Yours
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-balance">
            {hero.title}
          </h1>
          <p className="mt-3 text-white/85 text-lg max-w-md">{hero.subtitle}</p>
        </div>

        {mode === "flights" && (
          <div className="relative pb-16 sm:pb-20">
            <FareTicker />
          </div>
        )}
      </section>

      <section className="relative max-w-5xl mx-auto w-full px-4 sm:px-6 -mt-12 sm:-mt-16 pb-20">
        <div className="glass-card rounded-3xl shadow-2xl shadow-indigo-900/10">
          <div className="flex p-2 gap-2 rounded-t-3xl overflow-hidden">
            {MODES.map((m) => {
              const isActive = mode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`relative flex-1 sm:flex-none sm:px-8 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? m.key === "flights"
                        ? "bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white shadow-lg shadow-violet-300/50"
                        : "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-300/50"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-900/5"
                  }`}
                >
                  <m.Icon className="w-4 h-4" />
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-6 pt-2">
            {mode === "flights" ? <SearchForm /> : <BusSearchForm />}
          </div>
        </div>
      </section>
    </div>
  );
}
