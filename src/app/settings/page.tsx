"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  User,
  Sliders,
  ShieldAlert,
  Check,
  RefreshCw,
  Trash2,
  Sparkles,
  Bell,
  Eye,
  Paintbrush,
  Moon,
  Sun,
  Monitor,
  MapPin,
  Compass,
  Award,
  BookOpen
} from "lucide-react";
import confetti from "canvas-confetti";
import { useUser } from "@/context/UserContext";


const INDIAN_CITIES = ["Chennai", "Coimbatore", "Madurai", "Trichy", "Bangalore", "Mumbai", "Delhi"];
const COMMUTE_OPTIONS = ["Walking", "Cycling", "Bus", "Metro", "Train", "Scooter", "Motorcycle", "Car", "Mixed"];

export default function SettingsPage() {
  const router = useRouter();
  const { profile, settings, updateProfile, updateSettings } = useUser();
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "notifications" | "privacy" | "appearance">("profile");
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states — initialized from global context
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState(21);
  const [locationInput, setLocationInput] = useState("");
  const [commutePreference, setCommutePreference] = useState("Bus");

  // Autocomplete suggestions
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync form from context when profile loads initially
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (profile.username && !hasInitialized.current) {
      setFullName(profile.username || "");
      setAge(profile.age ?? 21);
      setLocationInput(profile.primaryLocation || "");
      setCommutePreference(profile.commutePreference || "Bus");
      hasInitialized.current = true;
    }
  }, [profile.username, profile.age, profile.primaryLocation, profile.commutePreference]);

  // Handle outside click to close location suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setCitySuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationInput(val);
    if (!val.trim()) {
      setCitySuggestions([]);
    } else {
      const filtered = INDIAN_CITIES.filter(city =>
        city.toLowerCase().includes(val.toLowerCase())
      );
      setCitySuggestions(filtered);
    }
  };

  const selectCity = (city: string) => {
    setLocationInput(city);
    setCitySuggestions([]);
  };

  // Debounced auto-save for text changes
  const saveTextSettings = async () => {
    if (!fullName.trim() || !locationInput.trim()) return;
    setLoading(true);
    await updateProfile({
      username: fullName.trim(),
      age: Number(age),
      primaryLocation: locationInput.trim(),
      commutePreference: commutePreference,
    });
    setLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const prevTextSignature = useRef("");
  useEffect(() => {
    const signature = JSON.stringify({ fullName, age, locationInput, commutePreference });
    if (prevTextSignature.current === "") {
      prevTextSignature.current = signature;
      return;
    }
    if (prevTextSignature.current === signature) return;

    const timeout = setTimeout(() => {
      prevTextSignature.current = signature;
      void saveTextSettings();
    }, 900);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullName, age, locationInput, commutePreference]);

  const handleClearCache = () => {
    if (confirm("Are you sure you want to clear your local cache? This will delete all commuting history logs, XP, and streaks, and reset your onboarding profile.")) {
      localStorage.removeItem("mamagreen_stats");
      localStorage.removeItem("mamagreen_history");
      localStorage.removeItem("mamagreen_challenges");
      localStorage.removeItem("mamagreen_units");
      window.location.href = "/";
    }
  };

  const updateAvatar = async (type: string) => {
    await updateProfile({ avatarType: type });
    confetti({
      particleCount: 20,
      spread: 30,
      colors: ["#2E5E4E", "#8FAF8F"]
    });
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-brand-forest/5 p-6 rounded-3xl border border-brand-forest/10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-sage/5 rounded-full blur-3xl -z-10" />
        
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-poppins text-brand-forest tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-brand-forest animate-spin-slow" />
            Control Cabinet
          </h2>
          <p className="text-xs text-brand-brown/80 mt-1 font-medium">
            Customize your carbon targets, measurement metrics, and account credentials.
          </p>
        </div>
        {saveSuccess && (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xxs font-extrabold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            Auto-Saved!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Settings Sidebar Tabs (4 cols) */}
        <div className="md:col-span-4 space-y-4">
          <div className="glass-card rounded-3xl p-4 border border-brand-sage/20 space-y-2 bg-white/40">
            <span className="block text-[9px] font-bold text-brand-forest/65 uppercase tracking-wider pl-1 mb-2">Sections</span>
            {[
              { id: "profile", label: "Profile Settings", icon: User },
              { id: "preferences", label: "Travel Preferences", icon: Sliders },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "privacy", label: "Privacy", icon: Eye },
              { id: "appearance", label: "Appearance", icon: Paintbrush },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-brand-forest text-brand-cream shadow-md"
                        : "text-brand-brown/70 hover:text-brand-forest hover:bg-brand-forest/5"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Stats Panel */}
          <div className="glass-card rounded-3xl p-5 border border-brand-sage/20 bg-white/40 space-y-3">
            <span className="block text-[9px] font-bold text-brand-brown/50 uppercase tracking-wide">Quick Profile Stats</span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-forest/10 border border-brand-forest/20 flex items-center justify-center text-brand-forest font-bold text-sm">
                {profile.username ? profile.username.substring(0, 2).toUpperCase() : "ET"}
              </div>
              <div>
                <p className="text-xs font-extrabold text-brand-forest">{profile.username}</p>
                <p className="text-[9px] text-brand-brown/60 font-semibold">{profile.ecoHealthLevel} · Lvl {profile.level}</p>
              </div>
            </div>
            <div className="border-t border-brand-forest/5 pt-2 flex justify-between text-xxs font-bold text-brand-brown/60">
              <span>Eco Points</span>
              <span className="text-brand-forest">{profile.ecohealthScore * 10} Points</span>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Panel (8 cols) */}
        <div className="md:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Profile Settings */}
              {activeTab === "profile" && (
                <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 bg-white/40 space-y-5">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-forest border-b border-brand-forest/10 pb-3 flex items-center gap-1.5">
                    <User className="w-4.5 h-4.5" />
                    Personal Profile Settings
                  </h3>

                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 mb-1 px-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName || ""}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white/70 border border-brand-sage/35 focus:border-brand-forest focus:outline-none rounded-2xl py-3 px-4 text-xs font-semibold text-brand-brown placeholder-brand-brown/40 transition-all shadow-sm"
                      />
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 mb-1 px-1">Age (years)</label>
                      <input
                        type="number"
                        required
                        min="12"
                        max="100"
                        value={age ?? 21}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full bg-white/70 border border-brand-sage/35 focus:border-brand-forest focus:outline-none rounded-2xl py-3 px-4 text-xs font-semibold text-brand-brown transition-all shadow-sm"
                      />
                    </div>

                    {/* Primary Location Autocomplete */}
                    <div className="relative" ref={suggestionsRef}>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 mb-1 px-1">Primary Location</label>
                      <input
                        type="text"
                        required
                        value={locationInput || ""}
                        onChange={handleLocationChange}
                        onFocus={() => {
                          if (locationInput.trim()) {
                            const filtered = INDIAN_CITIES.filter(c =>
                              c.toLowerCase().includes(locationInput.toLowerCase())
                            );
                            setCitySuggestions(filtered);
                          } else {
                            setCitySuggestions(INDIAN_CITIES);
                          }
                        }}
                        className="w-full bg-white/70 border border-brand-sage/35 focus:border-brand-forest focus:outline-none rounded-2xl py-3 px-4 text-xs font-semibold text-brand-brown placeholder-brand-brown/40 transition-all shadow-sm"
                      />
                      
                      {citySuggestions.length > 0 && (
                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-brand-sage/20 rounded-2xl shadow-lg max-h-36 overflow-y-auto">
                          {citySuggestions.map((city) => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => selectCity(city)}
                              className="w-full px-4 py-2 text-left text-xs font-semibold text-brand-brown hover:bg-brand-forest/5 transition-all block border-b border-brand-forest/5 last:border-b-0 cursor-pointer"
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Preferred Commuting Mode */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 mb-1 px-1">Default Commuting preference</label>
                      <select
                        value={commutePreference || "Bus"}
                        onChange={(e) => setCommutePreference(e.target.value)}
                        className="w-full bg-white/70 border border-brand-sage/35 focus:border-brand-forest focus:outline-none rounded-2xl py-3 px-4 text-xs font-semibold text-brand-brown appearance-none cursor-pointer shadow-sm"
                      >
                        {COMMUTE_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Travel Preferences */}
              {activeTab === "preferences" && (
                <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 bg-white/40 space-y-5">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-forest border-b border-brand-forest/10 pb-3 flex items-center gap-1.5">
                    <Sliders className="w-4.5 h-4.5" />
                    Travel & Goal Preferences
                  </h3>

                  <div className="space-y-4">
                    {/* Measurement Metric system */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 mb-2 px-1">Measurement system</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-brand-brown cursor-pointer select-none">
                          <input
                            type="radio"
                            name="units"
                            value="metric"
                            checked={settings.unitsPreference === "metric"}
                            onChange={() => updateSettings({ unitsPreference: "metric" })}
                            className="accent-brand-forest w-4 h-4 cursor-pointer"
                          />
                          Metric (Kilometers, Kilograms)
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-brand-brown cursor-pointer select-none">
                          <input
                            type="radio"
                            name="units"
                            value="imperial"
                            checked={settings.unitsPreference === "imperial"}
                            onChange={() => updateSettings({ unitsPreference: "imperial" })}
                            className="accent-brand-forest w-4 h-4 cursor-pointer"
                          />
                          Imperial (Miles, Pounds)
                        </label>
                      </div>
                    </div>

                    {/* Weekly Carbon reduction Target */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 px-1">Weekly Carbon target</label>
                        <span className="text-xs font-extrabold text-brand-forest">{settings.weeklyCarbonTarget || 20} kg CO₂</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={settings.weeklyCarbonTarget || 20}
                        onChange={(e) => updateSettings({ weeklyCarbonTarget: Number(e.target.value) })}
                        className="w-full accent-brand-forest cursor-pointer"
                      />
                      <span className="block text-[8px] font-semibold text-brand-brown/40 mt-1">Increasing this target raises your milestone achievements requirements.</span>
                    </div>

                    {/* Weekly Steps Goal */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 px-1">Weekly Steps goal</label>
                        <span className="text-xs font-extrabold text-brand-forest">{(settings.weeklyStepsGoal || 8000).toLocaleString()} steps</span>
                      </div>
                      <input
                        type="range"
                        min="2000"
                        max="20000"
                        step="500"
                        value={settings.weeklyStepsGoal || 8000}
                        onChange={(e) => updateSettings({ weeklyStepsGoal: Number(e.target.value) })}
                        className="w-full accent-brand-forest cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === "notifications" && (
                <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 bg-white/40 space-y-5">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-forest border-b border-brand-forest/10 pb-3 flex items-center gap-1.5">
                    <Bell className="w-4.5 h-4.5" />
                    Alerts & Notifications
                  </h3>

                  <div className="space-y-4">
                    {[
                      { key: "achievementAlerts", label: "Achievement Alerts", desc: "Get real-time notification alerts when unlocking badges and leveling up." },
                      { key: "carbonMilestones", label: "Carbon Milestone alerts", desc: "Notify when reaching important CO₂ savings milestones (e.g. 50kg)." },
                      { key: "weeklySummaries", label: "Weekly Eco summaries", desc: "Receive weekly carbon reductions reports and health steps summaries." },
                      { key: "transitRecs", label: "Transit recommendations", desc: "Proactive route updates and carbon saving commuters tips." }
                    ].map((item) => (
                      <div key={item.key} className="flex justify-between items-start gap-4">
                        <div className="space-y-0.5">
                          <label className="text-xs font-extrabold text-brand-forest">{item.label}</label>
                          <p className="text-[10px] text-brand-brown/65 leading-relaxed font-semibold">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(settings[item.key as keyof typeof settings])}
                            onChange={(e) => updateSettings({ [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-brand-forest/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-4 after:w-4 after:h-4 after:transition-all peer-checked:bg-brand-forest"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy */}
              {activeTab === "privacy" && (
                <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 bg-white/40 space-y-5">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-forest border-b border-brand-forest/10 pb-3 flex items-center gap-1.5">
                    <Eye className="w-4.5 h-4.5" />
                    Privacy Preferences
                  </h3>

                  <div className="space-y-4">
                    {[
                      { key: "shareStats", label: "Share Eco Stats", desc: "Allow other travelers in India Center to view your carbon savings." },
                      { key: "publicProfile", label: "Public Profile", desc: "Allow other members to search your username and view unlocked achievements." },
                      { key: "rankingVisibility", label: "Community Ranking visibility", desc: "Display your ranking position on regional and national leaderboards." }
                    ].map((item) => (
                      <div key={item.key} className="flex justify-between items-start gap-4">
                        <div className="space-y-0.5">
                          <label className="text-xs font-extrabold text-brand-forest">{item.label}</label>
                          <p className="text-[10px] text-brand-brown/65 leading-relaxed font-semibold">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(settings[item.key as keyof typeof settings])}
                            onChange={(e) => updateSettings({ [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-brand-forest/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-4 after:w-4 after:h-4 after:transition-all peer-checked:bg-brand-forest"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appearance */}
              {activeTab === "appearance" && (
                <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 bg-white/40 space-y-6">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-forest border-b border-brand-forest/10 pb-3 flex items-center gap-1.5">
                    <Paintbrush className="w-4.5 h-4.5" />
                    Appearance & Theme Settings
                  </h3>

                  {/* Dark Mode Theme card selection */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 px-1">Interface Mode</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: "light", label: "Light Mode", icon: Sun, value: false },
                        { id: "dark", label: "Dark Mode", icon: Moon, value: true }
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = settings.darkMode === item.value;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateSettings({ darkMode: item.value })}
                            className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-brand-forest border-brand-forest text-brand-cream shadow-md"
                                : "bg-white/50 border-brand-sage/20 text-brand-brown hover:bg-white/80"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-bold">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Accent Colors selection */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 px-1">Accent colors theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "forest", label: "Forest Green", hex: "#2E7D32" },
                        { id: "ocean", label: "Ocean Blue", hex: "#1565C0" },
                        { id: "earth", label: "Earth Brown", hex: "#795548" }
                      ].map((accent) => {
                        const isSelected = (settings.accentColor || "forest") === accent.id;
                        return (
                          <button
                            key={accent.id}
                            type="button"
                            onClick={() => updateSettings({ accentColor: accent.id as any })}
                            className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-brand-forest border-brand-forest text-brand-cream shadow-md"
                                : "bg-white/50 border-brand-sage/20 text-brand-brown hover:bg-white/80"
                            }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20 block" style={{ backgroundColor: accent.hex }} />
                            <span className="text-xs font-bold">{accent.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Danger Zone: Cache clears */}
          <div className="glass-card rounded-3xl p-6 border border-rose-200/50 bg-rose-500/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-700 border-b border-rose-200/30 pb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4.5 h-4.5 text-rose-600 animate-pulse" />
              Danger Zone
            </h3>

            <p className="text-[10px] text-rose-800/80 leading-relaxed font-semibold">
              Clearing your cache removes all stored carbon logs, mileage history, xp achievements, and resets the initial onboarding wizard. This action is irreversible.
            </p>

            <button
              type="button"
              onClick={handleClearCache}
              className="flex items-center justify-center gap-2 px-5 py-3 border border-rose-300 hover:bg-rose-500 text-rose-700 hover:text-white font-bold rounded-2xl transition-all text-xs cursor-pointer bg-white"
            >
              <Trash2 className="w-4 h-4" />
              Clear Local Cache & Reset Onboarding
            </button>
          </div>

        </div>
      </div>
      
    </div>
  );
}
