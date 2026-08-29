"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserIcon, PlaneIcon } from "@/components/icons";

const inputClass =
  "w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 bg-white/70 transition-colors focus:outline-none focus:border-indigo-400 focus:bg-white";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const redirectTo = searchParams.get("redirect") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Enter your name and email to continue.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    signIn({ name: name.trim(), email: email.trim() });
    router.push(redirectTo);
  }

  function continueAsGuest() {
    router.push(redirectTo);
  }

  return (
    <div className="max-w-sm mx-auto w-full px-4 sm:px-6 py-16">
      <div className="text-center mb-8">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white shadow-lg shadow-violet-300/50 mb-4">
          <UserIcon className="w-7 h-7" />
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">Sign in to SkyBook</h1>
        <p className="text-sm text-slate-500 mt-1">
          Mock sign-in — no password needed, just your name and email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 flex flex-col gap-3">
        <input
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          required
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-sm text-red-600 animate-[shake_0.3s_ease-in-out]">{error}</p>}
        <button
          type="submit"
          className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-xl hover:shadow-violet-300/50 text-white font-bold rounded-full px-6 py-3 transition-all cursor-pointer"
        >
          Sign in / Sign up
        </button>
      </form>

      <button
        type="button"
        onClick={continueAsGuest}
        className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
      >
        <PlaneIcon className="w-4 h-4" />
        Continue as guest
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-slate-500">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
