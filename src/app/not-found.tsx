import Link from "next/link";
import RouteSearchButton from "@/components/RouteSearchButton";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Error 404</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          This flight has left the gate
        </h1>
        <p className="mt-3 text-slate-600">
          We couldn&rsquo;t find that page. Search for a flight, or start from one of these popular routes.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-500 px-6 py-3 font-bold text-white hover:shadow-lg hover:shadow-violet-300/50 transition-all"
          >
            Search flights
          </Link>
          <Link
            href="/flights"
            className="rounded-full border-2 border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 hover:border-indigo-300 transition-all"
          >
            Browse routes
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
          {[
            ["DEL", "BOM", "Delhi to Mumbai"],
            ["BLR", "DEL", "Bengaluru to Delhi"],
            ["DEL", "DXB", "Delhi to Dubai"],
          ].map(([from, to, label]) => (
            <RouteSearchButton
              key={`${from}-${to}`}
              from={from}
              to={to}
              label={label}
              className="rounded-full bg-white border border-slate-200 px-3 py-1.5 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
