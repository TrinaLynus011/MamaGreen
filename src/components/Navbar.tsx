"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Navigation,
  Compass,
  Camera,
  MessageCircle,
  BarChart3,
  Award,
  Trophy,
  Settings,
  Menu,
  X,
  Edit2,
  Check,
  LogOut,
  Flame,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSidebar } from "@/context/SidebarContext";
import { useUserStore } from "@/store/userStore";

const INDIAN_CITIES = ["Chennai", "Coimbatore", "Madurai", "Trichy", "Bangalore", "Mumbai", "Delhi"];
const COMMUTE_OPTIONS = ["Walking", "Cycling", "Bus", "Metro", "Train", "Scooter", "Motorcycle", "Car", "Mixed"];

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/routes", icon: Navigation, label: "Route Planner" },
  { href: "/tracker", icon: Compass, label: "Mobility Tracker" },
  { href: "/challenges", icon: Award, label: "Challenges" },
  { href: "/achievements", icon: Trophy, label: "Achievements" },
  { href: "/greenlens", icon: Camera, label: "GreenLens AI" },
  { href: "/coach", icon: MessageCircle, label: "AI Coach" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { profile, updateProfile } = useUser();
  const { collapsed, toggleSidebar } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState(21);
  const [editLocation, setEditLocation] = useState("");
  const [editCommute, setEditCommute] = useState("Bus");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const showNav = pathname !== "/" && pathname !== "/login";

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setLocationSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!showNav) return null;

  const enterEditMode = () => {
    setEditName(profile.username || "");
    setEditAge(profile.age ?? 21);
    setEditLocation(profile.primaryLocation || "");
    setEditCommute(profile.commutePreference || "Bus");
    setIsEditing(true);
    setSaveStatus("idle");
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditLocation(val);
    setLocationSuggestions(
      val.trim()
        ? INDIAN_CITIES.filter((c) => c.toLowerCase().includes(val.toLowerCase()))
        : []
    );
  };

  const saveEdits = async () => {
    if (!editName.trim() || !editLocation.trim()) return;
    setSaveStatus("saving");
    await updateProfile({
      username: editName.trim(),
      age: Number(editAge),
      primaryLocation: editLocation.trim(),
      commutePreference: editCommute,
    });
    setSaveStatus("saved");
    setTimeout(() => {
      setIsEditing(false);
      setSaveStatus("idle");
    }, 1200);
  };

  const handleSignOut = () => {
    useUserStore.getState().logout();
    window.location.href = "/login";
  };

  // ── Sidebar interior content ──────────────────────────────────
  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    return (
      <div className="flex flex-col h-full">
        {/* Logo + collapse toggle (desktop only) */}
        <div className={`flex items-center ${collapsed && !mobile ? "justify-center px-3" : "justify-between px-5"} py-5 border-b border-brand-forest/10`}>
          {(!collapsed || mobile) && (
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 flex-shrink-0">
                <Image
                  src="/assets/MamaGreen-logo.png"
                  alt="MamaGreen"
                  fill
                  className="object-contain drop-shadow group-hover:scale-110 transition-transform"
                />
              </div>
              <span className="font-black text-base text-brand-forest font-poppins tracking-tight">
                Mama<span className="text-brand-sage">Green</span>
              </span>
            </Link>
          )}
          {collapsed && !mobile && (
            <Link href="/dashboard">
              <div className="relative w-8 h-8">
                <Image src="/assets/MamaGreen-logo.png" alt="MamaGreen" fill className="object-contain drop-shadow" />
              </div>
            </Link>
          )}
          {!mobile && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-brand-forest/10 text-brand-forest/50 hover:text-brand-forest transition-all ml-1"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              aria-controls="sidebar-nav"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : <ChevronLeft className="w-4 h-4" aria-hidden="true" />}
            </button>
          )}
        </div>

        {/* Nav links */}
        <nav id="sidebar-nav" className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2" aria-label="Main navigation">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
              >
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                    isActive
                      ? "bg-brand-forest text-brand-cream shadow-sm"
                      : "text-brand-forest/70 hover:bg-brand-forest/10 hover:text-brand-forest"
                  } ${collapsed && !mobile ? "justify-center px-2" : ""}`}
                  title={collapsed && !mobile ? label : undefined}
                >
                  <Icon
                    className={`flex-shrink-0 ${collapsed && !mobile ? "w-5 h-5" : "w-4 h-4"} ${isActive ? "text-brand-cream" : "text-brand-forest/60 group-hover:text-brand-forest"}`}
                    aria-hidden="true"
                  />
                  {(!collapsed || mobile) && (
                    <span className="text-sm font-semibold truncate">{label}</span>
                  )}
                  {/* Active indicator dot for collapsed mode */}
                  {collapsed && !mobile && isActive && (
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-sage" aria-hidden="true" />
                  )}
                  {/* Tooltip for collapsed mode */}
                  {collapsed && !mobile && (
                    <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-brand-forest text-brand-cream text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50" role="tooltip">
                      {label}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Profile card */}
        <div className={`border-t border-brand-forest/10 p-3 ${collapsed && !mobile ? "flex flex-col items-center gap-2" : ""}`}>
          {isEditing && (!collapsed || mobile) ? (
            /* ── Edit form ── */
            <div className="space-y-2">
              <input
                className="w-full px-3 py-1.5 rounded-lg border border-brand-forest/20 text-xs font-medium bg-white/70 focus:outline-none focus:border-brand-forest/60 text-brand-forest"
                placeholder="Your name"
                value={editName || ""}
                onChange={(e) => setEditName(e.target.value)}
              />
              <input
                type="number"
                className="w-full px-3 py-1.5 rounded-lg border border-brand-forest/20 text-xs font-medium bg-white/70 focus:outline-none focus:border-brand-forest/60 text-brand-forest"
                placeholder="Age"
                value={editAge ?? ""}
                min={5}
                max={100}
                onChange={(e) => setEditAge(Number(e.target.value))}
              />
              <div className="relative" ref={suggestionsRef}>
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-forest/40" />
                <input
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-brand-forest/20 text-xs font-medium bg-white/70 focus:outline-none focus:border-brand-forest/60 text-brand-forest"
                  placeholder="City"
                  value={editLocation || ""}
                  onChange={handleLocationChange}
                />
                {locationSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-brand-forest/10 overflow-hidden">
                    {locationSuggestions.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setEditLocation(c); setLocationSuggestions([]); }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-brand-forest hover:bg-brand-forest/5 transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select
                className="w-full px-3 py-1.5 rounded-lg border border-brand-forest/20 text-xs font-medium bg-white/70 focus:outline-none text-brand-forest"
                value={editCommute}
                onChange={(e) => setEditCommute(e.target.value)}
              >
                {COMMUTE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={saveEdits}
                  disabled={saveStatus === "saving"}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    saveStatus === "saved"
                      ? "bg-emerald-500 text-white"
                      : "bg-brand-forest text-brand-cream hover:bg-brand-forest/90"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved!" : "Save"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-brand-forest/60 hover:bg-brand-forest/10 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* ── Profile display ── */
            <div className={collapsed && !mobile ? "flex flex-col items-center gap-2" : "flex gap-3 items-start"}>
              {(!collapsed || mobile) ? (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-forest/10 flex items-center justify-center text-brand-forest">
                  <Compass className="w-4.5 h-4.5" />
                </div>
              ) : (
                <button
                  onClick={enterEditMode}
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-forest/10 flex items-center justify-center text-brand-forest hover:bg-brand-forest/20 transition-all cursor-pointer"
                  title="Edit profile"
                >
                  <Compass className="w-4.5 h-4.5" />
                </button>
              )}

              {/* Info — hidden when collapsed */}
              {(!collapsed || mobile) && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800 truncate">{profile.username}</p>
                    <button onClick={enterEditMode} className="p-1 rounded-md hover:bg-brand-forest/10 text-brand-forest/40 hover:text-brand-forest transition-all ml-1 flex-shrink-0">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium truncate flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 flex-shrink-0 text-brand-forest/60" />
                    {profile.primaryLocation} · {profile.commutePreference}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200">
                      🔥 {profile.streak}d
                    </span>
                    <span className="flex items-center gap-0.5 bg-emerald-50 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                      ⭐ Lvl {profile.level}
                    </span>
                    <span className="text-[9px] text-gray-500 font-semibold">{profile.ecoHealthLevel}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sign Out */}
          {(!collapsed || mobile) && !isEditing && (
            <button
              onClick={handleSignOut}
              className="mt-2 w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold text-brand-brown/50 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}
          {/* Sign out icon only for collapsed */}
          {collapsed && !mobile && (
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 rounded-xl text-brand-brown/40 hover:text-rose-600 hover:bg-rose-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── DESKTOP SIDEBAR ───────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="hidden md:flex flex-col fixed left-0 top-0 h-full bg-brand-cream border-r border-brand-forest/10 shadow-sm z-40 overflow-hidden"
        style={{ minWidth: collapsed ? 64 : 256 }}
      >
        <SidebarContent mobile={false} />
      </motion.aside>

      {/* ── MOBILE TOP BAR ───────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-brand-cream/95 backdrop-blur-md border-b border-brand-forest/10 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image src="/assets/MamaGreen-logo.png" alt="MamaGreen" fill className="object-contain drop-shadow" />
          </div>
          <span className="font-black text-sm text-brand-forest font-poppins">
            Mama<span className="text-brand-sage">Green</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Initials Badge for mobile top bar */}
          <div className="w-8 h-8 rounded-full bg-brand-forest/10 border border-brand-forest/20 flex items-center justify-center text-brand-forest font-bold text-xs">
            {profile.username ? profile.username.substring(0, 2).toUpperCase() : "ET"}
          </div>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="p-2 rounded-xl bg-brand-forest/10 text-brand-forest hover:bg-brand-forest/20 transition-all"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── MOBILE DRAWER ────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-brand-forest/20 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="md:hidden fixed top-0 left-0 h-full w-72 z-50 bg-brand-cream shadow-2xl border-r border-brand-forest/10"
            >
              <SidebarContent mobile={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
