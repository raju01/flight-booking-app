"use client";

import { useEffect, useState } from "react";
import { loadLoyaltyState, tierForPoints } from "@/lib/loyalty";
import { LoyaltyState } from "@/types/loyalty";
import { StarIcon, PlaneIcon } from "@/components/icons";

const EMPTY_STATE: LoyaltyState = { totalPoints: 0, transactions: [] };

const TIER_STYLES: Record<string, string> = {
  Silver: "from-slate-400 to-slate-500",
  Gold: "from-amber-400 to-yellow-500",
  Platinum: "from-indigo-500 via-violet-500 to-fuchsia-500",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RewardsPage() {
  const [state, setState] = useState<LoyaltyState>(EMPTY_STATE);

  useEffect(() => {
    // Reads localStorage (unavailable during SSR) after mount to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadLoyaltyState());
  }, []);

  const { tier, nextTier, pointsForNextTier } = tierForPoints(state.totalPoints);

  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 mb-1">
        <StarIcon className="w-6 h-6 text-amber-500" filled />
        SkyBook Rewards
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Earn 2 points for every ₹100 spent on flights. Points are stored locally in this browser.
      </p>

      <div
        className={`rounded-3xl p-6 sm:p-8 text-white bg-gradient-to-br ${TIER_STYLES[tier]} shadow-lg shadow-violet-200 mb-6 relative overflow-hidden`}
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <p className="text-xs uppercase tracking-wider font-semibold opacity-80 mb-1">
          Current tier
        </p>
        <p className="text-3xl font-extrabold mb-4">{tier}</p>
        <p className="text-4xl font-extrabold mb-1">{state.totalPoints.toLocaleString("en-IN")}</p>
        <p className="text-sm opacity-90">total points</p>

        {nextTier && pointsForNextTier !== null && (
          <p className="text-xs mt-4 opacity-90">
            Earn {pointsForNextTier.toLocaleString("en-IN")} more points to reach {nextTier}.
          </p>
        )}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Points history</h2>
        {state.transactions.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm bg-white/50 flex flex-col items-center gap-3">
            <PlaneIcon className="w-6 h-6 text-slate-300" />
            <p>No points earned yet. Book a flight to start earning rewards.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {state.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{t.description}</p>
                  <p className="text-xs text-slate-400">{formatDate(t.date)}</p>
                </div>
                <span className="font-bold text-emerald-600">+{t.points}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
