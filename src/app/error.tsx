"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-slate-600">
          That didn&rsquo;t work. Try again, or head back and start a new search.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-500 px-6 py-3 font-bold text-white cursor-pointer"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border-2 border-slate-200 bg-white px-6 py-3 font-bold text-slate-700"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
