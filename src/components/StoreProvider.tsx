"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";

// Intercept all fetch requests globally to inject JWT token
if (typeof window !== "undefined" && !(window as any).__fetchIntercepted) {
  (window as any).__fetchIntercepted = true;
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as any).url;
    if (urlStr && urlStr.includes("/api/") && !urlStr.includes("/api/auth/")) {
      const token = localStorage.getItem("mamagreen_token");
      if (token) {
        init = init || {};
        const headers = init.headers ? { ...init.headers } : {};
        (headers as any)["Authorization"] = `Bearer ${token}`;
        (headers as any)["X-Authorization"] = token;
        init.headers = headers as HeadersInit;
      }
    }
    return originalFetch(input, init);
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hydrateFromStorage = useUserStore((state) => state.hydrateFromStorage);
  const fetchProfile = useUserStore((state) => state.fetchProfile);

  useEffect(() => {
    hydrateFromStorage();
    if (localStorage.getItem("mamagreen_token")) {
      fetchProfile();
    }
  }, [fetchProfile, hydrateFromStorage]);

  return <>{children}</>;
}
