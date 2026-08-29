"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserIcon, ChevronIcon } from "@/components/icons";

export default function SiteHeader() {
  const router = useRouter();
  const { user, isReady, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSignOut() {
    signOut();
    setMenuOpen(false);
    router.push("/");
  }

  return (
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
          <Link href="/alerts" className="hover:text-indigo-600 transition-colors">
            Fare alerts
          </Link>
          <Link href="/manage" className="hover:text-indigo-600 transition-colors">
            Manage booking
          </Link>

          {isReady && user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full bg-slate-900/5 hover:bg-slate-900/10 transition-colors px-3 py-1.5 cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700 font-semibold">{user.name.split(" ")[0]}</span>
                <ChevronIcon
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 glass-card rounded-2xl shadow-xl p-1.5 animate-[fadeInUp_0.15s_ease-out]">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full bg-slate-900/5 hover:bg-slate-900/10 transition-colors px-3 py-1.5 cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-slate-500" />
              Sign in
            </Link>
          )}
          <span className="hidden lg:inline px-3 py-1.5 rounded-full bg-slate-900/5">
            Demo booking experience
          </span>
        </nav>
      </div>
    </header>
  );
}
