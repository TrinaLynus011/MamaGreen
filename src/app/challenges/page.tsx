"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Award,
  Sparkles,
  Trophy,
  Calendar,
  Clock,
  CheckCircle,
  Lock,
  Compass,
  Footprints,
  Bus,
  Activity,
  Trees,
  RefreshCw,
  X
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { API_BASE_URL } from "@/constants";

const BADGES = [
  { id: "first_walk", title: "First Walk", description: "Completed your first tracked walking route.", icon: Footprints, color: "text-emerald-600 bg-emerald-50 border-emerald-200", condition: "Log 1 walking trip", unlocked: true },
  { id: "carbon_saver", title: "Carbon Saver", description: "Saved more than 10kg of CO₂ from entering the atmosphere.", icon: Activity, color: "text-blue-600 bg-blue-50 border-blue-200", condition: "Save 10kg CO₂ total", unlocked: true },
  { id: "eco_warrior", title: "Eco Warrior", description: "Achieved Level 5 on the sustainability scale.", icon: Trophy, color: "text-amber-600 bg-amber-50 border-amber-200", condition: "Reach level 5 (Current: Lvl 3)", unlocked: false },
  { id: "transport_hero", title: "Public Transport Hero", description: "Substituted a driving commute with public transit.", icon: Bus, color: "text-indigo-600 bg-indigo-50 border-indigo-200", condition: "Complete a bus or train trip", unlocked: true },
  { id: "forest_guardian", title: "Forest Guardian", description: "Achieved a premium EcoHealth Score above 75 points.", icon: Trees, color: "text-teal-600 bg-teal-50 border-teal-200", condition: "Reach 75 EcoHealth Rating", unlocked: true }
];

export default function Challenges() {
  const applyProfilePatch = useUserStore((state) => state.applyProfilePatch);
  const fetchProfile = useUserStore((state) => state.fetchProfile);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [badges, setBadges] = useState(BADGES);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [backendActive, setBackendActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchChallengesData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/challenges`);
      if (res.ok) {
        const data = await res.json();
        setChallenges(data);
        setBackendActive(true);
      } else {
        setBackendActive(false);
        loadLocalChallenges();
      }
    } catch (err) {
      setBackendActive(false);
      loadLocalChallenges();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalChallenges = () => {
    const saved = localStorage.getItem("mamagreen_challenges");
    if (saved) {
      setChallenges(JSON.parse(saved));
    } else {
      // Seed default daily + weekly challenges
      const defaultChalls = [
        { id: 1, title: "Walk 5,000 steps", description: "Track your foot travel and complete 5,000 steps today.", type: "daily", goalValue: 5000.0, currentValue: 4200.0, rewardXp: 50, rewardScore: 2.0, isCompleted: false, isClaimed: false },
        { id: 2, title: "Use public transport once", description: "Take a bus or train trip instead of driving.", type: "daily", goalValue: 1.0, currentValue: 1.0, rewardXp: 40, rewardScore: 1.5, isCompleted: true, isClaimed: false },
        { id: 3, title: "Reduce 1kg CO₂", description: "Save at least 1kg of carbon emissions today compared to driving.", type: "daily", goalValue: 1.0, currentValue: 0.8, rewardXp: 60, rewardScore: 3.0, isCompleted: false, isClaimed: false },
        { id: 4, title: "Reduce weekly emissions by 10%", description: "Lower your total emissions compared to your baseline commute.", type: "weekly", goalValue: 10.0, currentValue: 7.5, rewardXp: 150, rewardScore: 5.0, isCompleted: false, isClaimed: false },
        { id: 5, title: "Complete 3 eco actions", description: "Log at least 3 eco-friendly travel events (walk, bike, transit) this week.", type: "weekly", goalValue: 3.0, currentValue: 2.0, rewardXp: 100, rewardScore: 4.0, isCompleted: false, isClaimed: false }
      ];
      setChallenges(defaultChalls);
      localStorage.setItem("mamagreen_challenges", JSON.stringify(defaultChalls));
    }
  };

  useEffect(() => {
    fetchChallengesData();
  }, []);

  const handleClaimReward = async (id: number, xp: number, score: number) => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.75 },
      colors: ["#2E5E4E", "#8FAF8F", "#D4AF37", "#4CAF50"]
    });

    if (backendActive) {
      try {
        const res = await fetch(`${API_BASE_URL}/challenges/claim/${id}`, { method: "POST" });
        if (res.ok) {
          void fetchProfile();
          fetchChallengesData();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const updated = challenges.map(c => c.id === id ? { ...c, isClaimed: true } : c);
      setChallenges(updated);
      localStorage.setItem("mamagreen_challenges", JSON.stringify(updated));

      // Update local profile stats
      const savedStats = localStorage.getItem("mamagreen_stats") || "{}";
      const stats = JSON.parse(savedStats);
      stats.xp = (stats.xp || 480) + xp;
      stats.ecohealthScore = Math.min(100, (stats.ecohealthScore || 78.5) + score);
      localStorage.setItem("mamagreen_stats", JSON.stringify(stats));
      applyProfilePatch({
        xp: stats.xp,
        ecoHealthScore: stats.ecohealthScore,
      });
    }
  };

  const handleBadgeClick = (badge: any) => {
    if (badge.unlocked) {
      setSelectedBadge(badge);
      confetti({
        particleCount: 30,
        spread: 40,
        colors: ["#D4AF37", "#2E5E4E"]
      });
    }
  };

  const dailyChalls = challenges.filter((c) => c.type === "daily");
  const weeklyChalls = challenges.filter((c) => c.type === "weekly");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream text-brand-forest">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="font-medium font-poppins text-sm">Synching Achievements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
      
      {/* Page Title Header */}
      <div>
        <span className="text-xs uppercase tracking-wider text-brand-forest/60 font-semibold">Trophies & Gamification</span>
        <h2 className="text-2xl md:text-3xl font-extrabold font-poppins text-brand-forest tracking-tight mt-0.5">
          Challenges & Achievements
        </h2>
      </div>

      {/* Main Grid: Challenges left, Badges right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Daily & Weekly Challenges (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Daily Challenges */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-forest" />
                <h3 className="font-bold text-base font-poppins text-brand-forest">Daily Tasks</h3>
              </div>
              <span className="text-xxs font-semibold text-brand-forest bg-brand-forest/10 px-2 py-0.5 rounded-full">Resets Daily</span>
            </div>

            <div className="space-y-4">
              {dailyChalls.map((c) => {
                const pct = Math.min(100, (c.currentValue / c.goalValue) * 100);
                const isClaimable = c.isCompleted && !c.isClaimed;
                return (
                  <div key={c.id} className={`p-4 rounded-2xl border ${
                    c.isClaimed ? "bg-brand-forest/5 border-brand-forest/5 opacity-70" : "bg-white/40 border-brand-sage/15"
                  } flex flex-col sm:flex-row justify-between sm:items-center gap-4`}>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-brand-forest">{c.title}</span>
                        {c.isClaimed ? (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Claimed</span>
                        ) : c.isCompleted ? (
                          <span className="text-[9px] font-bold text-yellow-700 bg-yellow-500/10 px-2 py-0.5 rounded-full animate-bounce">Ready</span>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-brand-brown/70">{c.description}</p>
                      
                      {/* Mini progress bar */}
                      <div className="w-full max-w-xs mt-2">
                        <div className="flex justify-between text-[8px] text-brand-brown/50 font-bold mb-1">
                          <span>Progress</span>
                          <span>{c.currentValue} / {c.goalValue}</span>
                        </div>
                        <div className="w-full bg-brand-forest/10 h-1 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-forest rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:border-l border-brand-forest/5 sm:pl-4">
                      <span className="text-xxs font-bold text-accent-gold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 fill-accent-gold text-accent-gold" />
                        +{c.rewardXp} XP
                      </span>
                      {isClaimable ? (
                        <button
                          onClick={() => handleClaimReward(c.id, c.rewardXp, c.rewardScore)}
                          className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-brand-forest font-bold text-xxs rounded-xl shadow-sm hover:scale-103 transition-all"
                        >
                          Claim
                        </button>
                      ) : c.isClaimed ? (
                        <span className="text-xxs font-semibold text-brand-forest">Claimed! 🎉</span>
                      ) : (
                        <span className="text-xxs font-semibold text-brand-brown/40">Active</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Challenges */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-forest" />
                <h3 className="font-bold text-base font-poppins text-brand-forest">Weekly Milestones</h3>
              </div>
              <span className="text-xxs font-semibold text-brand-forest bg-brand-forest/10 px-2 py-0.5 rounded-full">3 Days Left</span>
            </div>

            <div className="space-y-4">
              {weeklyChalls.map((c) => {
                const pct = Math.min(100, (c.currentValue / c.goalValue) * 100);
                const isClaimable = c.isCompleted && !c.isClaimed;
                return (
                  <div key={c.id} className={`p-4 rounded-2xl border ${
                    c.isClaimed ? "bg-brand-forest/5 border-brand-forest/5 opacity-70" : "bg-white/40 border-brand-sage/15"
                  } flex flex-col sm:flex-row justify-between sm:items-center gap-4`}>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-brand-forest">{c.title}</span>
                        {c.isClaimed && <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Claimed</span>}
                      </div>
                      <p className="text-[10px] text-brand-brown/70">{c.description}</p>
                      
                      {/* Mini progress bar */}
                      <div className="w-full max-w-xs mt-2">
                        <div className="flex justify-between text-[8px] text-brand-brown/50 font-bold mb-1">
                          <span>Progress</span>
                          <span>{c.currentValue} / {c.goalValue}</span>
                        </div>
                        <div className="w-full bg-brand-forest/10 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-forest rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:border-l border-brand-forest/5 sm:pl-4">
                      <span className="text-xxs font-bold text-accent-gold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 fill-accent-gold text-accent-gold" />
                        +{c.rewardXp} XP
                      </span>
                      {isClaimable ? (
                        <button
                          onClick={() => handleClaimReward(c.id, c.rewardXp, c.rewardScore)}
                          className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-brand-forest font-bold text-xxs rounded-xl shadow-sm hover:scale-103 transition-all"
                        >
                          Claim
                        </button>
                      ) : c.isClaimed ? (
                        <span className="text-xxs font-semibold text-brand-forest">Claimed! 🎉</span>
                      ) : (
                        <span className="text-xxs font-semibold text-brand-brown/40">In Progress</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Badges & Achievements (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="glass-card rounded-3xl p-6 flex flex-col h-full">
            <span className="text-xs uppercase tracking-wider text-brand-forest/60 font-medium">Cabinet</span>
            <h3 className="text-lg font-bold font-poppins text-brand-forest mb-4">Badges Earned</h3>

            <div className="grid grid-cols-2 gap-3 flex-1">
              {badges.map((b) => {
                const Icon = b.icon;
                return (
                  <motion.div
                    key={b.id}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center select-none cursor-pointer ${
                      b.unlocked
                        ? "bg-white/70 border-brand-sage/20 shadow-sm hover:scale-103 transition-all"
                        : "bg-brand-forest/5 border-brand-forest/5 opacity-50"
                    }`}
                    onClick={() => handleBadgeClick(b)}
                    whileHover={b.unlocked ? { y: -2 } : {}}
                    whileTap={b.unlocked ? { scale: 0.98 } : {}}
                  >
                    <span className={`p-3 rounded-2xl border flex items-center justify-center mb-2 relative ${
                      b.unlocked ? b.color : "bg-brand-forest/10 text-brand-forest/40 border-brand-forest/5"
                    }`}>
                      <Icon className="w-5 h-5 stroke-[2.5]" />
                      {!b.unlocked && (
                        <Lock className="w-3.5 h-3.5 absolute bottom-0.5 right-0.5 text-brand-brown/80" />
                      )}
                    </span>
                    
                    <div className="space-y-0.5">
                      <span className="block font-bold text-xs text-brand-forest line-clamp-1">{b.title}</span>
                      <span className="block text-[8px] text-brand-brown/50 font-bold leading-none">{b.unlocked ? "Unlocked" : "Locked"}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Badge Reveal Dialog Overlay */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBadge(null)}
              className="absolute inset-0 bg-brand-forest/20 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="max-w-xs w-full bg-white rounded-3xl p-6 shadow-xl border border-brand-sage/20 relative z-10 flex flex-col items-center text-center"
            >
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-brand-forest/5 rounded-full text-brand-forest/50 hover:text-brand-forest"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-4 rounded-full bg-linear-to-tr from-brand-sage/20 to-brand-forest/10 mb-4 border border-brand-sage/10 relative">
                <div className="absolute inset-0 rounded-full animate-ping bg-brand-sage/10 opacity-75" />
                <selectedBadge.icon className="w-8 h-8 text-brand-forest stroke-[2.5] animate-sway" />
              </div>

              <span className="px-3 py-0.5 rounded-full text-[9px] font-bold text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 mb-2 inline-block">
                🏆 Verified Achievement
              </span>

              <h4 className="text-lg font-bold font-poppins text-brand-forest">{selectedBadge.title}</h4>
              <p className="text-xs text-brand-brown/80 mt-2 leading-relaxed font-medium">
                {selectedBadge.description}
              </p>

              <div className="w-full mt-4 pt-3 border-t border-brand-forest/5 flex items-center gap-1.5 justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] text-emerald-800 font-bold">Requirement Met: {selectedBadge.condition}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
