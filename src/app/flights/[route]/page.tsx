import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RouteSearchButton from "@/components/RouteSearchButton";
import { findAirport } from "@/lib/airports";
import { nearbyAirportCodes } from "@/lib/nearbyAirports";
import {
  ROUTES,
  isInternationalRoute,
  placeName,
  relatedRoutes,
  routeFromSlug,
  routeSlug,
} from "@/lib/routes";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Only the curated routes exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return ROUTES.map((route) => ({ route: routeSlug(route) }));
}

function describe(slug: string) {
  const route = routeFromSlug(slug);
  const from = route && findAirport(route.from);
  const to = route && findAirport(route.to);
  if (!route || !from || !to) return null;
  return { route, from, to, fromName: placeName(from), toName: placeName(to) };
}

export async function generateMetadata({ params }: { params: Promise<{ route: string }> }): Promise<Metadata> {
  const { route: slug } = await params;
  const info = describe(slug);
  if (!info) return {};
  const title = `Flights from ${info.fromName} to ${info.toName} — compare fares | ${SITE_NAME}`;
  const description = `Compare ${info.fromName} (${info.route.from}) to ${info.toName} (${info.route.to}) flight fares across airlines and booking sites. See every seller for the same flight, cheapest first.`;
  return {
    title,
    description,
    alternates: { canonical: `/flights/${slug}` },
    openGraph: { title, description, url: `/flights/${slug}`, type: "website", siteName: SITE_NAME },
  };
}

function jsonLd(data: unknown) {
  // "<" is escaped so the data can never close the script tag.
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

export default async function RoutePage({ params }: { params: Promise<{ route: string }> }) {
  const { route: slug } = await params;
  const info = describe(slug);
  if (!info) notFound();
  const { route, from, to, fromName, toName } = info;

  const international = isInternationalRoute(route);
  const nearby = [...nearbyAirportCodes(route.from), ...nearbyAirportCodes(route.to)]
    .map((code) => findAirport(code))
    .filter((a) => a !== undefined && a.name !== a.code);
  const related = relatedRoutes(route);

  const faqs: { question: string; answer: string }[] = [
    {
      question: `How can I find the cheapest flight from ${fromName} to ${toName}?`,
      answer: `Search your travel date on ${SITE_NAME}, then open Compare prices on any flight. You will see every airline and booking site selling that flight, with the lowest fare first. The fare calendar above the results shows whether nearby dates are cheaper.`,
    },
    {
      question: `Does ${SITE_NAME} sell the tickets?`,
      answer: `No. The airline or booking site you choose sells the ticket and handles changes and refunds. ${SITE_NAME} compares prices and sends you there. We may earn a commission from some partners, which does not change your price or how fares are ordered.`,
    },
    {
      question: `Can I get an alert when the ${fromName} to ${toName} fare drops?`,
      answer: `Yes. After you search, choose Set price alert on the results page and we will track the route for you.`,
    },
  ];
  if (international) {
    faqs.push({
      question: `Do I need a visa to travel from ${fromName} to ${toName}?`,
      answer: `Entry rules depend on your passport and the countries involved. Check the official government guidance for your destination and any transit stops before you book.`,
    });
  }

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Flights", item: `${SITE_URL}/flights` },
        { "@type": "ListItem", position: 3, name: `${fromName} to ${toName}`, item: `${SITE_URL}/flights/${slug}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
      {structuredData.map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />
      ))}

      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/" className="hover:text-indigo-600">Home</Link>
        {" › "}
        <Link href="/flights" className="hover:text-indigo-600">Flights</Link>
        {" › "}
        <span className="text-slate-700">{fromName} to {toName}</span>
      </nav>

      <header className="mt-4 rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-600 to-fuchsia-500 text-white p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
          {international ? "International flights" : "Domestic flights"}
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-balance">
          Flights from {fromName} to {toName}
        </h1>
        <p className="mt-3 max-w-2xl text-white/85">
          Compare live fares for {fromName} ({route.from}) to {toName} ({route.to}). For each flight we
          show the airline and every booking site selling it, cheapest first.
        </p>
        <RouteSearchButton
          from={route.from}
          to={route.to}
          label={`Search ${route.from} → ${route.to} flights`}
          className="mt-6 inline-block bg-white text-indigo-700 font-bold rounded-full px-6 py-3 hover:shadow-xl transition-all active:scale-95"
        />
      </header>

      <section className="mt-10 grid sm:grid-cols-2 gap-4">
        {[from, to].map((airport, i) => (
          <div key={airport.code} className="rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {i === 0 ? "Departing from" : "Arriving at"}
            </p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">
              {airport.city} <span className="font-mono text-indigo-600">{airport.code}</span>
            </p>
            <p className="text-sm text-slate-500">
              {airport.name}
              {airport.country ? `, ${airport.country}` : ", India"}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold text-slate-900">
          How to get the cheapest {fromName} to {toName} fare
        </h2>
        <ul className="mt-4 flex flex-col gap-3 text-slate-600">
          <li>
            <strong className="text-slate-900">Compare every seller.</strong> The same flight is often
            priced differently by the airline and each booking site.
          </li>
          <li>
            <strong className="text-slate-900">Check nearby dates.</strong> The fare calendar on the
            results page shows the cheapest day in the month.
          </li>
          <li>
            <strong className="text-slate-900">Watch the price insight.</strong> We tell you whether
            today&rsquo;s fares are low, typical or high for the route.
          </li>
          {nearby.length > 0 && (
            <li>
              <strong className="text-slate-900">Try nearby airports.</strong> Airports such as{" "}
              {nearby.map((a) => `${a!.city} (${a!.code})`).join(", ")} can sometimes be cheaper.
            </li>
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold text-slate-900">Frequently asked questions</h2>
        <div className="mt-4 flex flex-col gap-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-2xl bg-white border border-slate-200 p-4">
              <summary className="cursor-pointer font-semibold text-slate-900 list-none flex justify-between gap-3">
                {faq.question}
                <span className="text-indigo-500 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-slate-900">Related routes</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map((r) => {
              const a = findAirport(r.from);
              const b = findAirport(r.to);
              return (
                <Link
                  key={`${r.from}-${r.to}`}
                  href={`/flights/${routeSlug(r)}`}
                  className="rounded-2xl bg-white border border-slate-200 px-4 py-3 text-slate-700 font-medium hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100 transition-all"
                >
                  {a && placeName(a)} to {b && placeName(b)}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
