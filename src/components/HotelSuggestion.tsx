"use client";

import { hotelLink } from "@/lib/outboundLinks";
import { trackEvent } from "@/lib/track";

// A quiet "where to stay" link for the destination, opened on Cleartrip Hotels (a commission partner).
export default function HotelSuggestion({ city, className = "" }: { city: string; className?: string }) {
  const link = hotelLink(city);
  if (!link) return null;
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 ${className}`}
    >
      <div>
        <p className="font-bold text-slate-900">Need a place to stay?</p>
        <p className="text-sm text-slate-600">
          Opens {link.seller} Hotels: search for {link.town} and pick your dates there. We may earn a commission,
          at no extra cost to you.
        </p>
      </div>
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => trackEvent({ event: "hotel_click", city })}
        className="shrink-0 self-start sm:self-auto rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-bold text-white hover:shadow-lg hover:shadow-orange-200 transition-all active:scale-95"
      >
        {link.label} →
      </a>
    </div>
  );
}
