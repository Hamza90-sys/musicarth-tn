import { useEffect, useState } from "react";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};

export type StoredAuth = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};

const STORAGE_KEY = "musiqa_auth";
export const AUTH_STORAGE_EVENT = "musiqa-auth-change";

const notifyAuthChange = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
};

export const getStoredAuth = (): StoredAuth | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
};

export const setStoredAuth = (auth: StoredAuth) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  notifyAuthChange();
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
  notifyAuthChange();
};

/**
 * Picks up a session handed off from the landing login via the URL hash
 * (#session=<base64>), stores it, and cleans the URL. Returns true if a
 * session was consumed.
 */
export const bootstrapSessionFromUrl = (): boolean => {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  if (!hash.includes("session=")) return false;
  const raw = new URLSearchParams(hash.replace(/^#/, "")).get("session");
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  if (!raw) return false;
  try {
    const data = JSON.parse(decodeURIComponent(atob(raw))) as StoredAuth;
    if (data?.accessToken && data?.user) {
      setStoredAuth(data);
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

export const useStoredAuth = () => {
  const [auth, setAuth] = useState<StoredAuth | null>(() => getStoredAuth());

  useEffect(() => {
    const syncAuth = () => setAuth(getStoredAuth());

    window.addEventListener(AUTH_STORAGE_EVENT, syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener(AUTH_STORAGE_EVENT, syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  return auth;
};
