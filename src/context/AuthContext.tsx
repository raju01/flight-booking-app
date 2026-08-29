"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AuthUser } from "@/types/auth";
import { loadUser, saveUser, clearUser } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isReady: boolean;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Reads localStorage (unavailable during SSR) after mount to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(loadUser());
    setIsReady(true);
  }, []);

  function signIn(nextUser: AuthUser) {
    saveUser(nextUser);
    setUser(nextUser);
  }

  function signOut() {
    clearUser();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isReady, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
