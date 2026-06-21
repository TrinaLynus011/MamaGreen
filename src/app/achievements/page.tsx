"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Sparkles,
  Trophy,
  CheckCircle2,
  Lock,
  Footprints,
  Bus,
  Activity,
  Trees,
  X,
  Compass,
  ShieldCheck,
  Search
} from "lucide-react";
import confetti from "canvas-confetti";
import { useUser } from "@/context/UserContext";

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: any;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  category: "Fitness" | "Transit" | "Carbon" | "Milestones";
  condition: string;
  unlocked: boolean;
  currentValue: number;
  targetValue: number;
  dateAchieved?: string;
  xpReward: number;
  badgeColors: {
    bg: string;
    border: string;
    iconColor: string;
    glowColor: string;
    ringFrom: string;
    ringTo: string;
    badgeBg: string;
  };
}

const RARITY_CONFIG = {
  Common: {
    label: "Common",
    pillBg: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    outerRing: "ring-2 ring-emerald-200/60",
  },
  Rare: {
    label: "Rare",
    pillBg: "bg-blue-100 text-blue-800 border border-blue-200",
    outerRing: "ring-2 ring-blue-300/60",
  },
  Epic: {
    label: "Epic",
    pillBg: "bg-purple-100 text-purple-800 border border-purple-200",
    outerRing: "ring-2 ring-purple-300/70",
  },
  Legendary: {
    label: "Legendary",
    pillBg: "bg-amber-100 text-amber-900 border border-amber-300",
    outerRing: "ring-2 ring-amber-300/80",
  },
};

export default function Achievements() {
  const { profile } = useUser();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // Load history logs to compute dynamic locks
  useEffect(() => {
    const saved = localStorage.getItem("mamagreen_history");
    if (saved) {
      setHistoryLogs(JSON.parse(saved));
    }
  }, []);

  const totalTransitTrips = 36 + historyLogs.filter(log => ["bus", "metro", "train"].includes(log.mode.toLowerCase())).length;

  const BADGES_DATA: Badge[] = [
    {
      id: "first_walk",
      title: "First Steps",
      description: "Logged your first eco-commute by walking. Every journey starts with a single step.",
      icon: Footprints,
      rarity: "Common",
      category: "Fitness",
      condition: "Log 1 walking trip",
      unlocked: historyLogs.some(l => l.mode.toLowerCase() === "walking") || profile.stepsToday > 0,
      currentValue: historyLogs.some(l => l.mode.toLowerCase() === "walking") || profile.stepsToday > 0 ? 1 : 0,
      targetValue: 1,
      dateAchieved: "June 12, 2026",
      xpReward: 50,
      badgeColors: {
        bg: "from-emerald-50 to-green-100",
        border: "border-emerald-200",
        iconColor: "#059669",
        glowColor: "rgba(52,211,153,0.35)",
        ringFrom: "#6EE7B7",
        ringTo: "#059669",
        badgeBg: "#D1FAE5",
      },
    },
    {
      id: "transport_hero",
      title: "Transit Champion",
      description: "Chose the energy-saving Metro or bus over a private vehicle — one decision that changes cities.",
      icon: Bus,
      rarity: "Rare",
      category: "Transit",
      condition: "Log 50 transit trips",
      unlocked: totalTransitTrips >= 50,
      currentValue: totalTransitTrips,
      targetValue: 50,
      dateAchieved: "June 14, 2026",
      xpReward: 80,
      badgeColors: {
        bg: "from-blue-50 to-sky-100",
        border: "border-blue-200",
        iconColor: "#2563EB",
        glowColor: "rgba(59,130,246,0.35)",
        ringFrom: "#93C5FD",
        ringTo: "#2563EB",
        badgeBg: "#DBEAFE",
      },
    },
    {
      id: "carbon_crusher",
      title: "Carbon Saver",
      description: "Prevented a cumulative 40kg of CO₂ greenhouse gas emissions — the equivalent of planting 2 trees.",
      icon: Compass,
      rarity: "Rare",
      category: "Carbon",
      condition: "Save 40kg of CO₂ cumulative",
      unlocked: profile.carbonSaved >= 40,
      currentValue: Math.round(profile.carbonSaved),
      targetValue: 40,
      dateAchieved: "June 16, 2026",
      xpReward: 120,
      badgeColors: {
        bg: "from-teal-50 to-emerald-100",
        border: "border-teal-200",
        iconColor: "#0D9488",
        glowColor: "rgba(13,148,136,0.35)",
        ringFrom: "#99F6E4",
        ringTo: "#0D9488",
        badgeBg: "#CCFBF1",
      },
    },
    {
      id: "first_green_week",
      title: "7-Day Streak",
      description: "Maintained an unbroken streak of green commutes for a full 7 days. Consistency is progress.",
      icon: Award,
      rarity: "Epic",
      category: "Milestones",
      condition: "Maintain a 7-day active streak",
      unlocked: profile.streak >= 7,
      currentValue: profile.streak,
      targetValue: 7,
      dateAchieved: "June 18, 2026",
      xpReward: 200,
      badgeColors: {
        bg: "from-purple-50 to-indigo-100",
        border: "border-purple-200",
        iconColor: "#7C3AED",
        glowColor: "rgba(168,85,247,0.4)",
        ringFrom: "#C4B5FD",
        ringTo: "#7C3AED",
        badgeBg: "#EDE9FE",
      },
    },
    {
      id: "forest_guardian",
      title: "Forest Guardian",
      description: "Reached EcoHealth Score 75+ — your lifestyle actively regenerates ecosystems.",
      icon: Trees,
      rarity: "Legendary",
      category: "Milestones",
      condition: "Reach an EcoHealth score of 75",
      unlocked: profile.ecohealthScore >= 75,
      currentValue: Math.round(profile.ecohealthScore),
      targetValue: 75,
      dateAchieved: "June 18, 2026",
      xpReward: 350,
      badgeColors: {
        bg: "from-lime-50 to-green-100",
        border: "border-lime-300",
        iconColor: "#15803D",
        glowColor: "rgba(132,204,22,0.45)",
        ringFrom: "#BEF264",
        ringTo: "#15803D",
        badgeBg: "#ECFCCB",
      },
    },
    {
      id: "eco_warrior",
      title: "Eco Warrior",
      description: "Achieved the highest green mobility experience level — Earth Protector status.",
      icon: Trophy,
      rarity: "Legendary",
      category: "Milestones",
      condition: "Reach profile level 5",
      unlocked: profile.level >= 5,
      currentValue: profile.level,
      targetValue: 5,
      xpReward: 500,
      badgeColors: {
        bg: "from-amber-50 to-yellow-100",
        border: "border-amber-200",
        iconColor: "#B45309",
        glowColor: "rgba(217,119,6,0.35)",
        ringFrom: "#FDE68A",
        ringTo: "#B45309",
        badgeBg: "#FEF3C7",
      },
    },
  ];

  const handleCardClick = (badge: Badge) => {
    if (badge.unlocked) {
      setSelectedBadge(badge);
      confetti({
        particleCount: 70,
        spread: 55,
        origin: { y: 0.5 },
        colors: ["#D4AF37", "#2E5E4E", "#8FAF8F", "#C6FF7E", badge.badgeColors.iconColor],
      });
    }
  };

  // Group and filter badges
  const filteredBadges = BADGES_DATA.filter(
    (b) => activeCategory === "All" || b.category === activeCategory
  );

  const earnedBadges = filteredBadges.filter((b) => b.unlocked);
  const inProgressBadges = filteredBadges.filter((b) => !b.unlocked && b.currentValue > 0);
  const lockedBadges = filteredBadges.filter((b) => !b.unlocked && b.currentValue === 0);

  const unlockedCount = BADGES_DATA.filter((b) => b.unlocked).length;

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-brand-forest/5 p-6 rounded-3xl border border-brand-forest/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-sage/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-forest to-brand-sage flex items-center justify-center shadow-md flex-shrink-0">
            <Trophy className="w-7 h-7 text-brand-cream" />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-widest text-brand-forest/50 font-bold">Badge Cabinet</span>
            <h2 className="text-2xl md:text-3xl font-extrabold font-poppins text-brand-forest tracking-tight">
              Achievements
            </h2>
            <p className="text-xs text-brand-brown/60 font-medium mt-0.5">{profile.username} · {profile.ecoHealthLevel}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center px-4 py-2 rounded-2xl bg-white/60 border border-brand-forest/10 shadow-sm">
            <p className="text-2xl font-black text-brand-forest font-poppins">{unlockedCount}</p>
            <p className="text-[9px] uppercase tracking-wider font-bold text-brand-brown/50">Unlocked</p>
          </div>
          <div className="text-center px-4 py-2 rounded-2xl bg-white/60 border border-brand-forest/10 shadow-sm">
            <p className="text-2xl font-black text-brand-forest font-poppins">{BADGES_DATA.length}</p>
            <p className="text-[9px] uppercase tracking-wider font-bold text-brand-brown/50">Total</p>
          </div>
          {/* Progress arc */}
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#2E5E4E15" strokeWidth="5" />
              <circle
                cx="28" cy="28" r="22"
                fill="none" stroke="#2E5E4E" strokeWidth="5"
                strokeDasharray={`${(unlockedCount / BADGES_DATA.length) * 138} 138`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-brand-forest">
              {Math.round((unlockedCount / BADGES_DATA.length) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 p-1 bg-brand-forest/5 rounded-2xl border border-brand-forest/10 w-fit select-none">
        {["All", "Transit", "Carbon", "Fitness", "Milestones"].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xxs font-bold transition-all cursor-pointer ${
              activeCategory === cat
                ? "bg-brand-forest text-brand-cream shadow-sm"
                : "text-brand-brown/70 hover:text-brand-forest"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Earned Badges Section */}
      {earnedBadges.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-forest flex items-center gap-1.5 px-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Earned Achievements ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {earnedBadges.map((badge) => {
              const Icon = badge.icon;
              const rarity = RARITY_CONFIG[badge.rarity];
              return (
                <motion.div
                  key={badge.id}
                  layoutId={badge.id}
                  onClick={() => handleCardClick(badge)}
                  className="relative rounded-2xl overflow-hidden cursor-pointer select-none group transition-all duration-300 hover:-translate-y-1 shadow-sm border border-brand-sage/20 bg-white/40 flex flex-col items-center justify-center p-3 hover:shadow-md text-center h-[130px] gap-2"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${badge.badgeColors.bg} border ${badge.badgeColors.border} rounded-2xl -z-10`} />
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" style={{ boxShadow: `0 0 20px ${badge.badgeColors.glowColor}` }} />
                  
                  {/* Icon at top */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0" style={{ background: badge.badgeColors.badgeBg }}>
                    <Icon className="w-6 h-6 stroke-[2]" style={{ color: badge.badgeColors.iconColor }} />
                  </div>

                  {/* Title immediately below icon */}
                  <h4 className="font-bold text-xs text-brand-forest font-poppins leading-tight line-clamp-2 max-w-[90%]">{badge.title}</h4>

                  {/* Status directly beneath title */}
                  <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-0.5 leading-none shrink-0">
                    Unlocked
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* In Progress Badges Section */}
      {inProgressBadges.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1.5 px-1">
            <Activity className="w-4 h-4 text-amber-600 animate-pulse" />
            In Progress ({inProgressBadges.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {inProgressBadges.map((badge) => {
              const Icon = badge.icon;
              const rarity = RARITY_CONFIG[badge.rarity];
              const progressPct = Math.min(100, (badge.currentValue / badge.targetValue) * 100);
              return (
                <div key={badge.id} className="relative rounded-2xl overflow-hidden border border-brand-sage/20 bg-white/40 shadow-sm p-3 flex flex-col items-center justify-center text-center h-[130px] gap-2">
                  {/* Icon at top */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-forest/10 border border-brand-sage/10 shrink-0">
                    <Icon className="w-6 h-6 stroke-[1.8] text-brand-forest/65" />
                  </div>
                  
                  {/* Title immediately below icon */}
                  <h4 className="font-bold text-xs text-brand-forest font-poppins leading-tight line-clamp-2 max-w-[90%]">{badge.title}</h4>

                  {/* Status directly beneath title */}
                  <span className="text-[9px] font-bold text-amber-600 leading-none shrink-0">
                    {badge.currentValue} / {badge.targetValue}
                  </span>
                  
                  {/* Miniature progress bar */}
                  <div className="w-20 bg-brand-forest/10 h-1 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Badges Section */}
      {lockedBadges.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-brown/60 flex items-center gap-1.5 px-1">
            <Lock className="w-4 h-4 text-brand-brown/50" />
            Locked Achievements ({lockedBadges.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {lockedBadges.map((badge) => {
              const Icon = badge.icon;
              const rarity = RARITY_CONFIG[badge.rarity];
              return (
                <div key={badge.id} className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50/50 p-3 flex flex-col items-center justify-center text-center opacity-55 h-[130px] gap-2">
                  {/* Icon at top */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-200 border border-gray-300 shrink-0">
                    <Icon className="w-6 h-6 stroke-[1.8] text-gray-400" />
                  </div>
                  
                  {/* Title immediately below icon */}
                  <h4 className="font-bold text-xs text-gray-500 font-poppins leading-tight line-clamp-2 max-w-[90%]">{badge.title}</h4>

                  {/* Status directly beneath title */}
                  <span className="text-[9px] font-bold text-gray-400 leading-none shrink-0">
                    Locked
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBadge(null)}
              className="absolute inset-0 bg-brand-forest/25 backdrop-blur-lg"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 32 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="max-w-sm w-full bg-white rounded-3xl shadow-2xl border border-brand-sage/20 relative z-10 overflow-hidden"
            >
              {/* Modal header gradient */}
              <div
                className="px-6 pt-8 pb-6 flex flex-col items-center text-center relative"
                style={{
                  background: `linear-gradient(160deg, ${selectedBadge.badgeColors.ringFrom}30, ${selectedBadge.badgeColors.badgeBg}60, white)`
                }}
              >
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-brand-forest/8 rounded-full text-brand-forest/40 hover:text-brand-forest transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Large badge medallion */}
                <div className="relative mb-4">
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg border-2"
                    style={{
                      background: `linear-gradient(135deg, ${selectedBadge.badgeColors.ringFrom}50, ${selectedBadge.badgeColors.badgeBg})`,
                      borderColor: selectedBadge.badgeColors.border,
                      boxShadow: `0 12px 40px ${selectedBadge.badgeColors.glowColor}`,
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: selectedBadge.badgeColors.badgeBg }}
                    >
                      <selectedBadge.icon
                        className="w-9 h-9 stroke-[1.8]"
                        style={{ color: selectedBadge.badgeColors.iconColor }}
                      />
                    </div>
                    {/* Ping animation on modal */}
                    <div
                      className="absolute inset-0 rounded-3xl animate-ping opacity-20"
                      style={{ background: selectedBadge.badgeColors.badgeBg }}
                    />
                  </div>
                  {/* XP badge */}
                  <div
                    className="absolute -bottom-2 -right-2 px-2 py-1 rounded-full text-[10px] font-black text-white shadow-md"
                    style={{ background: selectedBadge.badgeColors.iconColor }}
                  >
                    +{selectedBadge.xpReward} XP
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-3 ${RARITY_CONFIG[selectedBadge.rarity].pillBg}`}>
                  {selectedBadge.rarity} Badge
                </span>
                <h4 className="text-xl font-black font-poppins text-brand-forest">{selectedBadge.title}</h4>
                <p className="text-xs text-brand-brown/70 mt-2 leading-relaxed font-medium max-w-[260px]">
                  {selectedBadge.description}
                </p>
              </div>

              {/* Modal footer details */}
              <div className="px-6 pb-6 pt-4 space-y-2.5 border-t border-brand-forest/8">
                {[
                  { label: "Badge ID", value: `MG-${selectedBadge.id.toUpperCase()}` },
                  { label: "Achieved", value: selectedBadge.dateAchieved || "—" },
                  { label: "XP Earned", value: `+${selectedBadge.xpReward} Green XP` },
                  { label: "Status", value: "100% Complete ✓" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-brand-brown/50 uppercase tracking-wider text-[9px]">{label}</span>
                    <span className="font-bold text-brand-forest text-[11px]">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
