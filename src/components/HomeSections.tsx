"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { findAirport } from "@/lib/airports";
import { BellIcon, PlaneIcon, SparkleIcon, StarIcon, WalletIcon } from "@/components/icons";

const POPULAR_ROUTES: [string, string][] = [
  ["DEL", "BOM"],
  ["BOM", "DEL"],
  ["BLR", "DEL"],
  ["DEL", "BLR"],
  ["BOM", "GOI"],
  ["CCU", "DEL"],
  ["MAA", "HYD"],
  ["BOM", "BLR"],
];

const INTERNATIONAL_ROUTES: [string, string][] = [
  ["DEL", "DXB"],
  ["BOM", "DXB"],
  ["DEL", "LHR"],
  ["BOM", "SIN"],
  ["BLR", "SIN"],
  ["DEL", "BKK"],
  ["DEL", "JFK"],
  ["BOM", "LHR"],
];

const STEPS = [
  { title: "Search", text: "Pick your route and date. We pull live fares for every flight." },
  { title: "Compare sellers", text: "See the same flight priced by the airline and booking sites, cheapest first." },
  { title: "Book with the one you pick", text: "Go straight to that seller's checkout at the price you saw." },
];

const PERKS = [
  { Icon: WalletIcon, title: "Lowest price on top", text: "The cheapest seller is marked Recommended, so you never overpay for the same seat." },
  { Icon: StarIcon, title: "Ranked by price, not commission", text: "Sellers are sorted by fare only. Our links never change the order." },
  { Icon: BellIcon, title: "Fare alerts", text: "Set a target price and come back when your route drops." },
  { Icon: SparkleIcon, title: "Share with friends", text: "Send a fare to WhatsApp in one tap and plan the trip together." },
];

function searchHref(from: string, to: string, date: string): string {
  return `/search?${new URLSearchParams({
    from,
    to,
    departDate: date,
    passengers: "1",
    adults: "1",
    children: "0",
    infants: "0",
    cabinClass: "Economy",
    tripType: "one-way",
  })}`;
}

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const subscribe = () => () => {};

function RouteGrid({ routes, date }: { routes: [string, string][]; date: string }) {
  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
      {routes.map(([from, to]) => (
        <Link
          key={`${from}-${to}`}
          href={searchHref(from, to, date)}
          className="group rounded-2xl bg-white border border-slate-200 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100"
        >
          <div className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            {from}
            <PlaneIcon className="w-4 h-4 text-fuchsia-400 rotate-90 transition-transform group-hover:translate-x-1" />
            {to}
          </div>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {findAirport(from)?.city} to {findAirport(to)?.city}
          </p>
        </Link>
      ))}
    </div>
  );
}

export default function HomeSections() {
  // Empty on the server and first render, so server and browser agree whatever day it is.
  const date = useSyncExternalStore(subscribe, () => futureDate(14), () => "");

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pb-20 flex flex-col gap-16">
      <section>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Popular routes</h2>
        <p className="mt-1 text-slate-500">One tap to see today&rsquo;s fares, two weeks from now.</p>
        <RouteGrid routes={POPULAR_ROUTES} date={date} />
        <h3 className="mt-8 text-lg font-bold text-slate-900">International</h3>
        <RouteGrid routes={INTERNATIONAL_ROUTES} date={date} />
      </section>


      <section>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">How it works</h2>
        <ol className="mt-5 grid sm:grid-cols-3 gap-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl bg-white border border-slate-200 p-5">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white text-sm font-bold">
                {index + 1}
              </span>
              <h3 className="mt-3 font-bold text-slate-900">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 border border-indigo-100 p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Why SkyBook</h2>
        <div className="mt-5 grid sm:grid-cols-2 gap-5">
          {PERKS.map(({ Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-white border border-indigo-100 shadow-sm flex items-center justify-center text-indigo-600">
                <Icon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-0.5 text-sm text-slate-500 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
