import { AuthUser } from "@/types/auth";

const STORAGE_KEY = "skybook_user";

export function loadUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.name && parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

export function saveUser(user: AuthUser) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // localStorage unavailable — session just won't persist
  }
}

export function clearUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
