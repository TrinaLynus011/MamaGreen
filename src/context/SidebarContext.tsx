"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface SidebarContextValue {
  collapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (val: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggleSidebar: () => {},
  setSidebarCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("mamagreen_sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("mamagreen_sidebar_collapsed", String(next));
      return next;
    });
  }, []);

  const setSidebarCollapsed = useCallback((val: boolean) => {
    setCollapsed(val);
    localStorage.setItem("mamagreen_sidebar_collapsed", String(val));
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar, setSidebarCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
