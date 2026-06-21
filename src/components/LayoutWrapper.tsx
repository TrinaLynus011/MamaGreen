"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useUser } from "@/context/UserContext";
import { useUserStore } from "@/store/userStore";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const showNav = pathname !== "/" && pathname !== "/login";
  const { collapsed } = useSidebar();
  const { settings } = useUser();
  const token = useUserStore((state) => state.token);
  const hydrated = useUserStore((state) => state.hydrated);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      
      // Dark Mode
      if (settings.darkMode) {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
      
      // Accent Color Themes
      html.classList.remove("theme-forest", "theme-ocean", "theme-earth");
      html.classList.add(`theme-${settings.accentColor || "forest"}`);
    }
  }, [settings.darkMode, settings.accentColor]);

  // Route guarding and protection redirects
  useEffect(() => {
    if (!hydrated) return;
    
    const isLoginOrRoot = pathname === "/" || pathname === "/login";
    const profile = useUserStore.getState().userProfile;
    const onboardingCompleted = profile.onboardingCompleted;

    if (!token && !isLoginOrRoot) {
      router.replace("/login");
    } else if (token) {
      if (!onboardingCompleted) {
        if (!isLoginOrRoot) {
          router.replace("/login");
        }
      } else {
        if (isLoginOrRoot) {
          router.replace("/dashboard");
        }
      }
    }
  }, [token, hydrated, pathname, router]);

  // Desktop: pl-16 when collapsed (icons-only sidebar w-16), pl-64 when expanded
  // Mobile: pt-16 for the top hamburger bar, no side padding
  const desktopPadding = showNav
    ? collapsed
      ? "md:pl-16"
      : "md:pl-64"
    : "";

  // Render children only when hydrated to prevent flash of unauthenticated screens
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream text-brand-forest">
        <div className="font-semibold font-poppins text-xs animate-pulse">Initializing MamaGreen...</div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${showNav ? `pt-16 md:pt-0 ${desktopPadding}` : ""}`}
    >
      {children}
    </div>
  );
}
