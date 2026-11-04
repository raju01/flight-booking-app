import type { Metadata } from "next";
import HotelSearchForm from "@/components/HotelSearchForm";
import PopularStays from "@/components/PopularStays";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Hotels — compare prices across booking sites | ${SITE_NAME}`,
  description:
    "Compare hotel and holiday home prices in Goa, Manali, Munnar, Jaipur, Udaipur, Rishikesh and hundreds more places in India. See what each booking site charges for the same hotel, cheapest first.",
  alternates: { canonical: "/hotels" },
};

export default function HotelsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-500 to-rose-500 text-white">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-24 sm:pb-28">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-white/15 border border-white/20 rounded-full px-3 py-1 mb-4">
            Compare · Save · Stay
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-balance">Compare hotel prices</h1>
          <p className="mt-3 text-white/85 text-lg max-w-md">
            See what each booking site charges for the same hotel, cheapest first.
          </p>
        </div>
      </section>

      <section className="relative max-w-5xl mx-auto w-full px-4 sm:px-6 -mt-16 pb-10">
        <div className="glass-card rounded-3xl shadow-2xl shadow-orange-900/10 p-4 sm:p-6">
          <HotelSearchForm />
        </div>
      </section>

      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 pb-16">
        <h2 className="text-2xl font-extrabold text-slate-900">Popular places to stay</h2>
        <p className="mt-1 mb-4 text-sm text-slate-500">A weekend two weeks from now, for two guests.</p>
        <PopularStays />
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["Every site, one list", "For each hotel we show the hotel's own site and each booking site, lowest price first."],
            ["Free cancellation shown", "Rates that can be cancelled for free are marked, with the last day to cancel."],
            ["You book with them", `${SITE_NAME} doesn't sell rooms. You book on the site you pick, which handles changes and refunds.`],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl bg-white border border-slate-200 p-5">
              <p className="font-bold text-slate-900">{title}</p>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
