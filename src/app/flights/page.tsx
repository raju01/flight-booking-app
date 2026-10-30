import type { Metadata } from "next";
import Link from "next/link";
import { findAirport } from "@/lib/airports";
import { ROUTES, isInternationalRoute, placeName, routeSlug } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Flight routes — compare fares from India and abroad | ${SITE_NAME}`,
  description: "Browse domestic and international flight routes and compare fares across airlines and booking sites.",
  alternates: { canonical: "/flights" },
};

function groupByOrigin(international: boolean) {
  const groups = new Map<string, typeof ROUTES>();
  for (const route of ROUTES.filter((r) => isInternationalRoute(r) === international)) {
    const list = groups.get(route.from) ?? [];
    list.push(route);
    groups.set(route.from, list);
  }
  return [...groups.entries()];
}

function RouteGroups({ international }: { international: boolean }) {
  return (
    <div className="mt-5 flex flex-col gap-6">
      {groupByOrigin(international).map(([origin, routes]) => {
        const from = findAirport(origin);
        return (
          <div key={origin}>
            <h3 className="font-bold text-slate-900">From {from && placeName(from)}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {routes.map((route) => {
                const to = findAirport(route.to);
                return (
                  <li key={route.to}>
                    <Link
                      href={`/flights/${routeSlug(route)}`}
                      className="inline-block rounded-full bg-white border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                    >
                      {to && placeName(to)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function FlightsIndexPage() {
  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Flight routes</h1>
      <p className="mt-2 text-slate-600">
        Pick a route to compare fares across airlines and booking sites. Don&rsquo;t see yours? Use the search on
        the <Link href="/" className="text-indigo-600 font-semibold hover:underline">home page</Link> for any
        airport in the world.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold text-slate-900">Domestic routes</h2>
        <RouteGroups international={false} />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-slate-900">International routes</h2>
        <RouteGroups international />
      </section>
    </div>
  );
}
