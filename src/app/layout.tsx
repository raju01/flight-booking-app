import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkyBook — Flight Booking",
  description: "Search and book flights",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#faf9ff]">
        <header className="sticky top-0 z-30 glass-card border-x-0 border-t-0 rounded-none">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 shadow-lg shadow-violet-300/50 transition-transform group-hover:scale-105 group-hover:rotate-3">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
                  <path
                    d="M10.5 3.5 3 12l3 1 2 3.5 1.5-1.5-1-3 3-3 4 7.5 1.5-1L14 4l-1-1-2.5.5Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Sky<span className="gradient-text [--gradient-from:theme(colors.indigo.600)] [--gradient-to:theme(colors.fuchsia.500)]">Book</span>
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate-500">
              <Link href="/explore" className="hover:text-indigo-600 transition-colors">
                Explore
              </Link>
              <Link href="/status" className="hover:text-indigo-600 transition-colors">
                Flight status
              </Link>
              <Link href="/rewards" className="hover:text-indigo-600 transition-colors">
                Rewards
              </Link>
              <span className="px-3 py-1.5 rounded-full bg-slate-900/5">Demo booking experience</span>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
