"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  Check,
  Footprints,
  Bike,
  Bus,
  Train,
  Car,
  Flame,
  Coins,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  RefreshCw,
  Plus,
  Zap
} from "lucide-react";
import confetti from "canvas-confetti";
import { useUserStore } from "@/store/userStore";
import { API_BASE_URL } from "@/constants";

const TRANSPORT_MODES = [
  { id: "walking", label: "Walk", icon: Footprints, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "bicycle", label: "Cycle", icon: Bike, color: "text-teal-600 bg-teal-50 border-teal-200" },
  { id: "metro", label: "Metro", icon: Train, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { id: "bus", label: "Bus", icon: Bus, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "auto", label: "Auto", icon: Navigation, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "scooter", label: "Scooter", icon: Zap, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "car", label: "Car", icon: Car, color: "text-rose-600 bg-rose-50 border-rose-200" }
];

const EMISSIONS_FACTORS = {
  walking: 0.0,
  bicycle: 0.0,
  metro: 0.015,
  bus: 0.04,
  auto: 0.08,
  scooter: 0.05,
  car: 0.18
};

const CALORIES_FACTORS = {
  walking: 60.0,
  bicycle: 40.0,
  metro: 0.0,
  bus: 0.0,
  auto: 0.0,
  scooter: 0.0,
  car: 0.0
};

const DEFAULT_MOCK_HISTORY = [
  { id: 1, date: "2026-06-18", mode: "bus", distance: 12.0, duration: 30.0, emissions: 0.48, calories: 0, cost: 15.0 },
  { id: 2, date: "2026-06-18", mode: "walking", distance: 3.5, duration: 45.0, emissions: 0.0, calories: 210.0, cost: 0.0 },
  { id: 3, date: "2026-06-17", mode: "bicycle", distance: 10.0, duration: 35.0, emissions: 0.0, calories: 400.0, cost: 0.0 },
  { id: 4, date: "2026-06-16", mode: "metro", distance: 15.0, duration: 25.0, emissions: 0.225, calories: 0, cost: 30.0 },
  { id: 5, date: "2026-06-16", mode: "walking", distance: 4.0, duration: 50.0, emissions: 0.0, calories: 240.0, cost: 0.0 }
];

export default function MobilityTracker() {
  const applyProfilePatch = useUserStore((state) => state.applyProfilePatch);
  const fetchProfile = useUserStore((state) => state.fetchProfile);
  const [mode, setMode] = useState("walking");
  const [distance, setDistance] = useState<number>(3.0);
  const [duration, setDuration] = useState<number>(20.0);
  const [history, setHistory] = useState<any[]>([]);
  const [backendActive, setBackendActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadTrackerData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/mobility/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        setBackendActive(true);
      } else {
        setBackendActive(false);
        loadLocalHistory();
      }
    } catch (err) {
      setBackendActive(false);
      loadLocalHistory();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalHistory = () => {
    const saved = localStorage.getItem("mamagreen_history");
    if (saved) {
      setHistory(JSON.parse(saved));
    } else {
      setHistory(DEFAULT_MOCK_HISTORY);
      localStorage.setItem("mamagreen_history", JSON.stringify(DEFAULT_MOCK_HISTORY));
    }
  };

  useEffect(() => {
    loadTrackerData();
  }, []);

  const getEstimatedCost = (m: string, d: number) => {
    const ml = m.toLowerCase();
    if (ml === "walking" || ml === "bicycle") return 0.0;
    if (ml === "metro") return 30.0;
    if (ml === "bus") return 15.0;
    if (ml === "auto") return 25.0 + d * 15.0;
    if (ml === "scooter") return d * 4.0;
    return d * 12.0; // car
  };

  // Pre-calculated stats based on inputs
  const estimatedEmissions = Number((distance * EMISSIONS_FACTORS[mode as keyof typeof EMISSIONS_FACTORS]).toFixed(3));
  const estimatedCalories = Number((distance * CALORIES_FACTORS[mode as keyof typeof CALORIES_FACTORS]).toFixed(1));
  const estimatedCost = Number(getEstimatedCost(mode, distance).toFixed(1));
  
  // Calculate relative carbon savings compared to driving a gasoline car
  const carEquivalent = distance * EMISSIONS_FACTORS.car;
  const carbonSaved = Number(Math.max(0, carEquivalent - estimatedEmissions).toFixed(2));
  const carEquivalentCost = distance * 12.0;
  const moneySaved = Number(Math.max(0, carEquivalentCost - estimatedCost).toFixed(1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (distance <= 0 || duration <= 0) return;

    setSubmitting(true);

    if (backendActive) {
      try {
        const formData = new FormData();
        formData.append("mode", mode);
        formData.append("distance", distance.toString());
        formData.append("duration", duration.toString());

        const res = await fetch(`${API_BASE_URL}/mobility/log`, {
          method: "POST",
          body: formData
        });

        if (res.ok) {
          confetti({
            particleCount: 50,
            spread: 60,
            colors: ["#2E5E4E", "#8FAF8F", "#4CAF50"]
          });
          void fetchProfile();
          loadTrackerData();
        }
      } catch (err) {
        console.error("Failed to log commute in backend", err);
      } finally {
        setSubmitting(false);
      }
    } else {
      // Simulate frontend-only submission
      setTimeout(() => {
        const todayStr = new Date().toISOString().split("T")[0];
        const newTrip = {
          id: Date.now(),
          date: todayStr,
          mode,
          distance,
          duration,
          emissions: estimatedEmissions,
          calories: estimatedCalories,
          cost: estimatedCost
        };

        const updated = [newTrip, ...history];
        setHistory(updated);
        localStorage.setItem("mamagreen_history", JSON.stringify(updated));

        // Update dashboard-linked mock stats
        const savedStats = localStorage.getItem("mamagreen_stats") || "{}";
        const stats = JSON.parse(savedStats);
        stats.carbonToday = Number(((stats.carbonToday || 1.4) + estimatedEmissions).toFixed(2));
        stats.carbonSaved = Number(((stats.carbonSaved || 42.3) + carbonSaved).toFixed(2));
        stats.caloriesToday = Number(((stats.caloriesToday || 185) + estimatedCalories).toFixed(1));
        stats.moneySaved = Number(((stats.moneySaved || 845.0) + moneySaved).toFixed(1));
        
        let xpGained = 0;
        const ml = mode.toLowerCase();
        if (ml === "walking" || ml === "bicycle") {
          xpGained = Math.round(distance * 20);
        } else if (ml === "metro" || ml === "bus") {
          xpGained = Math.round(distance * 12);
        } else if (ml === "auto") {
          xpGained = Math.round(distance * 4);
        }
        stats.xp = (stats.xp || 480) + xpGained;

        if (mode === "walking") {
          stats.stepsToday = (stats.stepsToday || 4200) + Math.round(distance * 1300);
        }
        localStorage.setItem("mamagreen_stats", JSON.stringify(stats));
        applyProfilePatch({
          carbonToday: stats.carbonToday,
          carbonSaved: stats.carbonSaved,
          caloriesToday: stats.caloriesToday,
          moneySaved: stats.moneySaved,
          xp: stats.xp,
          level: stats.level || 1,
          streak: stats.streak || 1,
          stepsToday: stats.stepsToday,
        });

        confetti({
          particleCount: 50,
          spread: 60,
          colors: ["#2E5E4E", "#8FAF8F", "#4CAF50"]
        });

        setSubmitting(false);
      }, 600);
    }
  };

  const getModeIcon = (modeStr: string) => {
    const found = TRANSPORT_MODES.find(m => m.id === modeStr);
    return found ? found.icon : Footprints;
  };

  const getModeColor = (modeStr: string) => {
    const found = TRANSPORT_MODES.find(m => m.id === modeStr);
    return found ? found.color : "text-brand-brown bg-brand-beige";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream text-brand-forest">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="font-medium font-poppins text-sm">Loading Timeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Form Logger */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between h-full">
          <div>
            <span className="text-xs uppercase tracking-wider text-brand-forest/60 font-semibold">Activity</span>
            <h2 className="text-xl font-bold font-poppins text-brand-forest mb-4">Log a Commute</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Transport mode selector grid */}
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-brand-brown/70 mb-2">
                  Select Transport Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TRANSPORT_MODES.map((m) => {
                    const isSelected = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id)}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all select-none ${
                          isSelected
                            ? "bg-brand-forest border-brand-forest text-brand-cream shadow-sm scale-[1.02]"
                            : "bg-white/50 border-brand-sage/20 text-brand-brown hover:bg-white/80"
                        }`}
                      >
                        <m.icon className={`w-5 h-5 ${isSelected ? "text-brand-cream" : "text-brand-forest"}`} />
                        <span className="text-[10px] font-semibold">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Distance input slider/box */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xxs font-bold uppercase tracking-wider text-brand-brown/70">
                    Distance (km)
                  </label>
                  <span className="text-xs font-bold text-brand-forest">{distance} km</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="40.0"
                  step="0.5"
                  value={distance}
                  onChange={(e) => setDistance(parseFloat(e.target.value))}
                  className="w-full accent-brand-forest cursor-pointer"
                />
              </div>

              {/* Duration input slider/box */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xxs font-bold uppercase tracking-wider text-brand-brown/70">
                    Duration (minutes)
                  </label>
                  <span className="text-xs font-bold text-brand-forest">{duration} mins</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="120"
                  step="2"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full accent-brand-forest cursor-pointer"
                />
              </div>

            </form>
          </div>

          {/* Realtime Carbon, Calories, Cost Calculations preview */}
          <div className="mt-6 border-t border-brand-forest/10 pt-4 space-y-4">
            <h4 className="text-xxs font-bold uppercase tracking-wider text-brand-brown/70 mb-2">Estimated Impact</h4>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-brand-forest/5 rounded-xl p-2.5 text-center border border-brand-forest/5">
                <Navigation className="w-4 h-4 text-brand-forest mx-auto mb-1.5" />
                <span className="block text-[10px] font-semibold text-brand-brown/60">Emissions</span>
                <span className="text-xs font-extrabold text-brand-forest">{estimatedEmissions} kg</span>
              </div>

              <div className="bg-orange-500/5 rounded-xl p-2.5 text-center border border-orange-500/5">
                <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1.5" />
                <span className="block text-[10px] font-semibold text-brand-brown/60">Calories</span>
                <span className="text-xs font-extrabold text-orange-600">+{estimatedCalories} kcal</span>
              </div>

              <div className="bg-emerald-500/5 rounded-xl p-2.5 text-center border border-emerald-500/5">
                <Coins className="w-4 h-4 text-emerald-600 mx-auto mb-1.5" />
                <span className="block text-[10px] font-semibold text-brand-brown/60">Transit Cost</span>
                <span className="text-xs font-extrabold text-emerald-700">₹{estimatedCost}</span>
              </div>
            </div>

            {/* Savings highlight */}
            {carbonSaved > 0 && (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-600 animate-pulse" />
                <span className="text-xxs text-emerald-800 font-bold leading-tight">
                  Saves {carbonSaved} kg of CO₂ compared to driving a gasoline car!
                </span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-forest hover:bg-brand-forest/90 disabled:bg-brand-forest/70 text-brand-cream font-bold font-poppins rounded-xl shadow-md transition-all text-xs"
            >
              <Plus className="w-4.5 h-4.5" />
              {submitting ? "Logging Commute..." : "Log Commute Trip"}
            </button>
          </div>
        </div>
      </div>

      {/* Middle/Right Columns: Timeline History */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="glass-card rounded-3xl p-6 flex flex-col flex-1 h-full">
          <div>
            <span className="text-xs uppercase tracking-wider text-brand-forest/60 font-semibold">Commute History</span>
            <h2 className="text-xl font-bold font-poppins text-brand-forest mb-4">Travel Timeline</h2>
          </div>

          <div className="flex-1 overflow-y-auto max-h-125 pr-2">
            <div className="relative border-l-2 border-brand-sage/30 pl-6 ml-4 space-y-6">
              
              <AnimatePresence initial={false}>
                {history.map((log, index) => {
                  const IconComponent = getModeIcon(log.mode);
                  const isGreen = ["walking", "bicycle", "metro", "bus"].includes(log.mode.toLowerCase());
                  
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      {/* Timeline dot */}
                      <span className={`absolute -left-9.25 top-1.5 flex h-7.5 w-7.5 items-center justify-center rounded-full border shadow-sm ${getModeColor(log.mode)}`}>
                        <IconComponent className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>

                      {/* Timeline Card */}
                      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-brand-forest capitalize">{log.mode} Commute</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              isGreen ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"
                            }`}>
                              {isGreen ? "Green Mode" : "High Footprint"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xxs font-semibold text-brand-brown/60">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{log.date}</span>
                            <span className="mx-1">•</span>
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{log.distance} km ({log.duration} mins)</span>
                          </div>
                        </div>

                        {/* Metrics summary */}
                        <div className="flex gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-brand-forest/5 justify-between">
                          <div className="text-center sm:text-right">
                            <span className="block text-[9px] font-bold text-brand-brown/50 uppercase">CO₂</span>
                            <span className={`text-xs font-extrabold ${log.emissions === 0 ? "text-emerald-600" : "text-brand-brown"}`}>
                              {log.emissions} kg
                            </span>
                          </div>
                          
                          {log.calories > 0 && (
                            <div className="text-center sm:text-right">
                              <span className="block text-[9px] font-bold text-brand-brown/50 uppercase">Burn</span>
                              <span className="text-xs font-extrabold text-orange-600">+{log.calories} kcal</span>
                            </div>
                          )}

                          <div className="text-center sm:text-right">
                            <span className="block text-[9px] font-bold text-brand-brown/50 uppercase">Cost</span>
                            <span className="text-xs font-extrabold text-brand-forest">
                              {log.cost === 0 ? "Free" : `₹${log.cost.toFixed(1)}`}
                            </span>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
