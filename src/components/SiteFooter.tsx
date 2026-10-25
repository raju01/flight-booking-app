import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
        <p>
          SkyBook compares flight fares. Tickets are sold by the airlines. We may earn a commission
          when you book through our links.
        </p>
        <nav className="flex gap-4 font-semibold shrink-0">
          <Link href="/about" className="hover:text-indigo-600">
            About
          </Link>
          <Link href="/disclosure" className="hover:text-indigo-600">
            Affiliate disclosure
          </Link>
          <Link href="/privacy" className="hover:text-indigo-600">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
