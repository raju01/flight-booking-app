"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadFareAlerts, removeFareAlert } from "@/lib/fareAlerts";
import { fetchFlights } from "@/lib/liveApi";
import { parseISODate, futureDate } from "@/lib/dates";
import { SOLO, describeParty, payingTravelers } from "@/lib/party";
import { findAirport, formatAirport } from "@/lib/airports";
import { formatPrice } from "@/lib/currency";
import { FareAlert } from "@/types/fareAlert";
import { BellIcon, PlaneIcon } from "@/components/icons";

// "checking": live lookup in progress; "unavailable": could not get real fares (never guessed);
// "expired": the travel date has passed.
interface AlertWithPrice extends FareAlert {
  state: "checking" | "ok" | "unavailable" | "expired";
  currentPrice: number | null;
}

export default function FareAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertWithPrice[]>([]);

  useEffect(() => {
    // Reads localStorage (unavailable during SSR) after mount to avoid a hydration mismatch.
    const today = futureDate(0);
    const saved = loadFareAlerts();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlerts(
      saved.map((a) => ({ ...a, currentPrice: null, state: a.date < today ? "expired" : "checking" }))
    );

    // Real fares for the same party the alert was saved for. Nothing is ever filled in with sample data.
    const controller = new AbortController();
    for (const alert of saved.filter((a) => a.date >= today)) {
      const party = alert.travelers ?? SOLO;
      fetchFlights(
        {
          from: alert.from,
          to: alert.to,
          date: alert.date,
          cabinClass: alert.cabinClass,
          passengers: party.adults + party.children,
          travelers: party,
        },
        controller.signal
      )
        .then((result) => {
          const live = result.source === "live" && result.flights.length > 0;
          setAlerts((prev) =>
            prev.map((a) =>
              a.id === alert.id
                ? {
                    ...a,
                    state: live ? "ok" : "unavailable",
                    currentPrice: live ? Math.min(...result.flights.map((f) => f.price)) : null,
                  }
                : a
            )
          );
        })
        .catch(() => {}); // page left
    }
    return () => controller.abort();
  }, []);

  function handleRemove(id: string) {
    removeFareAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  function handleView(alert: AlertWithPrice) {
    const party = alert.travelers ?? SOLO;
    const params = new URLSearchParams({
      from: alert.from,
      to: alert.to,
      departDate: alert.date,
      passengers: String(party.adults + party.children),
      adults: String(party.adults),
      children: String(party.children),
      infants: String(party.infants),
      cabinClass: alert.cabinClass,
      tripType: "one-way",
    });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 mb-1">
        <BellIcon className="w-6 h-6 text-amber-500" filled />
        Fare alerts
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Routes you&apos;re watching. We&apos;ll show you when the price has moved since you saved
        it.
      </p>

      {alerts.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm bg-white/50 flex flex-col items-center gap-3">
          <PlaneIcon className="w-6 h-6 text-slate-300" />
          <p>No fare alerts yet. Set one from any search results page.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => {
            const fromAirport = findAirport(alert.from);
            const toAirport = findAirport(alert.to);
            const dropped = alert.currentPrice !== null && alert.currentPrice < alert.savedPrice;
            const risen = alert.currentPrice !== null && alert.currentPrice > alert.savedPrice;

            return (
              <div
                key={alert.id}
                className="glass-card rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {fromAirport ? formatAirport(fromAirport) : alert.from} →{" "}
                    {toAirport ? formatAirport(toAirport) : alert.to}
                  </p>
                  <p className="text-xs text-slate-500">
                    {parseISODate(alert.date)?.toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    · {alert.cabinClass}
                    {payingTravelers(alert.travelers) > 1 && ` · ${describeParty(alert.travelers)}`} · saved at{" "}
                    {formatPrice(alert.savedPrice)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {alert.state === "checking" ? (
                      <p className="text-sm text-slate-500 animate-pulse">Checking fares…</p>
                    ) : alert.state === "expired" ? (
                      <p className="text-sm text-slate-500">Date has passed</p>
                    ) : alert.state === "unavailable" ? (
                      <p className="text-sm text-slate-500">Couldn&rsquo;t check right now</p>
                    ) : alert.currentPrice !== null ? (
                      <>
                        <p
                          className={`text-lg font-extrabold ${
                            dropped ? "text-emerald-600" : risen ? "text-red-500" : "text-slate-900"
                          }`}
                        >
                          {formatPrice(alert.currentPrice)}
                        </p>
                        {dropped && (
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                            Price dropped
                          </p>
                        )}
                        {risen && (
                          <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">
                            Price rose
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">No fares</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleView(alert)}
                    className="text-sm font-bold text-indigo-600 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(alert.id)}
                    aria-label="Remove alert"
                    className="text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
