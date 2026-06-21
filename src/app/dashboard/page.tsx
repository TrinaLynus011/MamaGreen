"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Flame,
  Award,
  Sparkles,
  TrendingDown,
  Footprints,
  RefreshCw,
  Trophy,
  Coins,
  ShieldCheck,
  CloudSun,
  Bell,
  Compass,
  ArrowRight,
  TrendingUp,
  MapPin,
  ChevronRight,
  Wallet,
  Leaf,
  Medal,
  Activity,
  FileText,
  Lock,
  ChevronLeft,
  X,
  Edit2
} from "lucide-react";
import ScoreGauge from "@/components/ScoreGauge";
import { useUser } from "@/context/UserContext";
import { getRecommendedAction, co2ToTrees } from "@/utils/calculators";
import { formatRupees, getTimeGreeting } from "@/utils/formatters";
import { API_BASE_URL } from "@/constants";

const FALLBACK_CHALLENGES = [
  { id: 1, title: "Walk 5,000 steps", description: "Walk around college or office, log at least 5,000 steps today.", type: "daily", goalValue: 5000.0, currentValue: 4200.0, rewardXp: 50, rewardScore: 2.0, isCompleted: false, isClaimed: false },
  { id: 2, title: "Use public transport once", description: "Take a Metro or BMTC/BEST bus instead of using a scooter or cab.", type: "daily", goalValue: 1.0, currentValue: 1.0, rewardXp: 40, rewardScore: 1.5, isCompleted: true, isClaimed: false },
  { id: 3, title: "Ditch cabs for 3 commutes", description: "Use Metro, cycling, or walking for 3 commutes this week.", type: "weekly", goalValue: 3.0, currentValue: 2.0, rewardXp: 120, rewardScore: 4.0, isCompleted: false, isClaimed: false },
];

const FALLBACK_LEADERBOARD = [
  { rank: 1, username: "Priya Sharma", xp: 750, isUser: false },
  { rank: 2, username: "Rahul Verma", xp: 680, isUser: false },
  { rank: 3, username: "You", xp: 480, isUser: true },
  { rank: 4, username: "Amit Patel", xp: 420, isUser: false },
  { rank: 5, username: "Rohan Das", xp: 310, isUser: false },
];

const FALLBACK_WEATHER = {
  city: "Bengaluru",
  temp: 27.5,
  condition: "Overcast & Cloudy",
  tip: "Pleasant breeze outside. Perfect for walking or cycling!"
};

const PROACTIVE_NOTIFS = [
  "Taking the bus tomorrow could save you ₹45 and reduce 0.8kg CO₂.",
  "You are only 1200 steps away from today's goal.",
  "Walking to the nearby grocery store instead of using your scooter could improve your EcoHealth Score.",
  "Sprout's energy is high. Cycle to college today to keep them thriving!"
];

export default function Dashboard() {
  const router = useRouter();
  const { profile, loading: profileLoading, backendActive: ctxBackendActive, refreshProfile } = useUser();
  const [challenges, setChallenges] = useState<any[]>(FALLBACK_CHALLENGES);
  const [leaderboard, setLeaderboard] = useState<any[]>(FALLBACK_LEADERBOARD);
  const [weather, setWeather] = useState<any>(FALLBACK_WEATHER);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("daily");
  const [notifIndex, setNotifIndex] = useState(0);
  const [backendActive, setBackendActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCertModal, setShowCertModal] = useState(false);

  const getGreetingLocal = () => getTimeGreeting();

  // Load weather and logs
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifIndex((prev) => (prev + 1) % PROACTIVE_NOTIFS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadWeatherOffline = (city: string) => {
    const weathersSim: Record<string, { temp: number; condition: string; tip: string }> = {
      "bengaluru": { temp: 27.5, condition: "Overcast & Cloudy", tip: "Pleasant breeze outside. Perfect for walking or cycling!" },
      "coimbatore": { temp: 29.0, condition: "Mild Breeze", tip: "Pleasant day. Walk or cycle to enjoy the Nilgiri roads!" },
      "madurai": { temp: 34.0, condition: "Warm / Sunny", tip: "Warm outside. Choose public buses/trains over solo autos to stay cool." },
      "trichy": { temp: 35.0, condition: "Sunny", tip: "Very bright day. Stay hydrated and travel via public transit." },
      "mumbai": { temp: 31.0, condition: "Humid / Patchy Rain", tip: "It's humid. Take the air-conditioned Metro to travel cool and save emissions!" },
      "delhi": { temp: 38.5, condition: "Sunny / Heat Alert", tip: "Strong sunlight. Opt for the Metro to stay safe and green." },
      "chennai": { temp: 33.0, condition: "Hot & Humid", tip: "Keep hydrated. Choose electric suburban trains over autos to save ₹50." }
    };
    const key = city.toLowerCase().trim();
    const matched = weathersSim[key] || weathersSim["bengaluru"];
    setWeather({ city, ...matched });
  };

  const fetchDashboardData = async () => {
    try {
      const challRes = await fetch(`${API_BASE_URL}/challenges`);
      if (challRes.ok) {
        const challData = await challRes.json();
        setChallenges(challData);
      }

      const leadRes = await fetch(`${API_BASE_URL}/leaderboard`);
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        setLeaderboard(leadData);
      }

      const userCity = profile.primaryLocation || "Bengaluru";
      const weatherRes = await fetch(`${API_BASE_URL}/weather?city=${encodeURIComponent(userCity)}`);
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        setWeather(weatherData);
      } else {
        loadWeatherOffline(userCity);
      }

      const historyRes = await fetch(`${API_BASE_URL}/history`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistoryLogs(historyData);
        localStorage.setItem("mamagreen_history", JSON.stringify(historyData));
      }

      setBackendActive(true);
    } catch {
      setBackendActive(false);
      loadOfflineData();
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineData = () => {
    const savedChallenges = localStorage.getItem("mamagreen_challenges");
    if (savedChallenges) {
      setChallenges(JSON.parse(savedChallenges));
    }
    const updatedLeaderboard = FALLBACK_LEADERBOARD.map((item) =>
      item.isUser ? { ...item, username: `${profile.username} (You)`, xp: profile.xp } : item
    ).sort((a, b) => b.xp - a.xp).map((item, i) => ({ ...item, rank: i + 1 }));
    setLeaderboard(updatedLeaderboard);
    loadWeatherOffline(profile.primaryLocation || "Bengaluru");

    // Load History logs
    const savedHistory = localStorage.getItem("mamagreen_history");
    if (savedHistory) {
      setHistoryLogs(JSON.parse(savedHistory));
    }
  };

  useEffect(() => {
    if (!profileLoading) {
      fetchDashboardData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoading]);

  useEffect(() => {
    if (!profileLoading && !profile.onboardingCompleted) {
      router.replace("/login");
    }
  }, [profileLoading, profile.onboardingCompleted, router]);

  const handleClaimReward = async (challengeId: number, rewardXp: number, rewardScore: number) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#2E5E4E", "#8FAF8F", "#D4AF37", "#C6FF7E"]
    });

    if (backendActive) {
      try {
        const res = await fetch(`${API_BASE_URL}/challenges/claim/${challengeId}`, {
          method: "POST"
        });
        if (res.ok) {
          fetchDashboardData();
        }
      } catch (err) {
        console.error("Failed to claim reward", err);
      }
    } else {
      const updated = challenges.map(c => (c.id === challengeId ? { ...c, isClaimed: true } : c));
      setChallenges(updated);
      localStorage.setItem("mamagreen_challenges", JSON.stringify(updated));
      refreshProfile();
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream text-brand-forest animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="font-semibold font-poppins text-sm">Gathering EcoStats...</span>
        </div>
      </div>
    );
  }

  // Calculate dynamic stats from logs
  const totalTransitTrips = 36 + historyLogs.filter(log => ["bus", "metro", "train"].includes(log.mode.toLowerCase())).length;
  const avoidedCarRides = Math.round(profile.carbonSaved / 1.5) + historyLogs.filter(log => ["walking", "cycling", "bus", "metro", "train"].includes(log.mode.toLowerCase())).length;
  const dynamicEcoPoints = Math.round(profile.ecohealthScore * 10);
  const topTravelerPercent = Math.max(2, Math.round(15 - profile.ecohealthScore * 0.1));

  // Determine active level title based on score
  const score = profile.ecohealthScore;
  let scoreTitle = "Seed";
  if (score >= 90) scoreTitle = "Earth Protector";
  else if (score >= 75) scoreTitle = "Forest Guardian";
  else if (score >= 60) scoreTitle = "Young Tree";
  else if (score >= 40) scoreTitle = "Sapling";

  const currentChallenges = challenges.filter(c => c.type === activeTab);

  // Dynamic locks for badges
  const isFirstWalkUnlocked = historyLogs.some(l => l.mode.toLowerCase() === "walking") || profile.stepsToday > 0;
  const isTransitChampionUnlocked = totalTransitTrips >= 50;
  const isCarbonSaverUnlocked = profile.carbonSaved >= 40;
  const isForestGuardianUnlocked = profile.ecohealthScore >= 75;

  // Calculate dynamic transit efficiency
  const greenCommutesCount = historyLogs.filter(log =>
    ["walking", "bicycle", "metro", "bus", "train"].includes(log.mode.toLowerCase())
  ).length;
  const transitEfficiency = historyLogs.length > 0
    ? Math.round((greenCommutesCount / historyLogs.length) * 100)
    : 92; // Fallback to 92% if no logs yet

  // Weekly transit usage timeline helper
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const weeklyTransitData = last7Days.map(date => {
    const dayLogs = historyLogs.filter(log => log.date === date);
    const count = dayLogs.filter(log => ["bus", "metro", "train"].includes(log.mode.toLowerCase())).length;
    const dayName = weekdays[new Date(date).getDay()];
    return { dayName, count };
  });

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
      
      {/* 1. Premium User Impact Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#2E7D32] p-8 text-white shadow-xl border border-emerald-700/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-800/40 rounded-full blur-2xl -z-10" />
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-emerald-100 bg-emerald-800/60 px-3 py-1 rounded-full border border-emerald-700/50">
                🌱 Eco Traveler
              </span>
              <h2 className="text-lg md:text-xl font-bold font-poppins mt-2.5 text-emerald-50">
                {profile.primaryLocation || "Trichy"} • {profile.commutePreference || "Bus"} Commuter
              </h2>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-black font-poppins tracking-tight text-white">
                ₹{profile.moneySaved || 771} Saved This Month
              </h1>
              <p className="text-xs font-semibold text-emerald-100 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-300" />
                <span>↑18% compared to last month</span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[220px] self-stretch md:self-auto justify-between">
            <button
              onClick={() => router.push("/settings")}
              className="px-4 py-2 border border-emerald-400/30 hover:border-emerald-300/60 bg-emerald-800/40 hover:bg-emerald-800/80 text-white font-bold text-xxs rounded-xl transition-all self-end cursor-pointer whitespace-nowrap shadow-sm"
            >
              Edit Commute Preferences
            </button>
            
            <div className="flex flex-wrap md:flex-col gap-2 pt-2 md:pt-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-bold shadow-sm">
                <span className="text-sm">🔥</span>
                <span>{profile.streak || 1} Day Streak</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-bold shadow-sm">
                <span className="text-sm">⭐</span>
                <span>{profile.xp || 600} Eco Points</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-bold shadow-sm">
                <span className="text-sm">⚡</span>
                <span>{transitEfficiency || 87}% Transit Efficiency</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coach Alert Tip */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-3 border-l-4 border-l-brand-forest shadow-sm bg-gradient-to-r from-brand-forest/5 via-brand-sage/5 to-white/40">
        <div className="p-2 bg-brand-forest/10 rounded-xl text-brand-forest animate-pulse shrink-0">
          <Bell className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="block text-[8px] font-bold text-brand-forest uppercase tracking-widest leading-none mb-1">Mama AI Coach Tip</span>
          <AnimatePresence mode="wait">
            <motion.p
              key={notifIndex}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-brand-forest font-bold leading-relaxed truncate"
            >
              {PROACTIVE_NOTIFS[notifIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Responsive Grid of Denser Stats (6 cards total) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Fares Saved */}
        <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 bg-white/40 flex flex-col justify-between h-auto min-h-fit gap-4 hover:shadow-lg transition-all duration-300 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-extrabold text-brand-brown/50 uppercase tracking-wider">Fares Saved</span>
              <h4 className="text-3xl font-black text-brand-forest font-poppins mt-2">₹{profile.moneySaved}</h4>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-700 rounded-2xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          
          <div className="py-2 text-emerald-600">
            <svg className="w-full h-8" viewBox="0 0 120 30">
              <path
                d="M 0 24 Q 15 5 30 18 T 60 4 T 90 20 T 120 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <TrendingUp className="w-4 h-4" />
            <span>↑ 18% this month</span>
          </div>
        </div>

        {/* Card 2: Carbon Saved */}
        <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 bg-white/40 flex flex-col justify-between h-auto min-h-fit gap-4 hover:shadow-lg transition-all duration-300 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-extrabold text-brand-brown/50 uppercase tracking-wider">Carbon Saved</span>
              <h4 className="text-3xl font-black text-brand-forest font-poppins mt-2">{profile.carbonSaved} kg</h4>
            </div>
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-12 h-12 rotate-[-90deg]">
                <circle cx="24" cy="24" r="18" stroke="rgba(46,94,78,0.1)" strokeWidth="3.5" fill="transparent" />
                <circle cx="24" cy="24" r="18" stroke="#2E5E4E" strokeWidth="3.5" fill="transparent"
                  strokeDasharray="113" strokeDashoffset={113 - (113 * Math.min(1, profile.carbonSaved / 50))} strokeLinecap="round" />
              </svg>
              <Leaf className="w-4 h-4 text-brand-forest absolute" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 w-fit">
            🌳 Equivalent to {co2ToTrees(profile.carbonSaved)} trees planted
          </div>
        </div>

        {/* Card 3: Current Carbon Footprint */}
        <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 bg-white/40 flex flex-col justify-between h-auto min-h-fit gap-4 hover:shadow-lg transition-all duration-300 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-extrabold text-brand-brown/50 uppercase tracking-wider">Current Carbon Footprint</span>
              <h4 className="text-3xl font-black text-red-700 font-poppins mt-2">{profile.carbonToday || 1.4} kg CO₂</h4>
            </div>
            <div className="p-3 bg-red-500/10 text-red-700 rounded-2xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 w-fit">
            ⚠️ Limit: 2.0 kg daily target
          </div>
        </div>

        {/* Card 4: Eco Score */}
        <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 bg-white/40 flex flex-col justify-between h-auto min-h-fit gap-4 hover:shadow-lg transition-all duration-300 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-extrabold text-brand-brown/50 uppercase tracking-wider">Eco Score</span>
              <h4 className="text-3xl font-black text-amber-700 font-poppins mt-2">{dynamicEcoPoints} Pts</h4>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-700 rounded-2xl">
              <Medal className="w-5 h-5 fill-amber-500/10" />
            </div>
          </div>

          <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 w-fit">
            🏆 Top {topTravelerPercent}% of travelers
          </span>
        </div>

        {/* Card 5: Transit Efficiency */}
        <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 bg-white/40 flex flex-col justify-between h-auto min-h-fit gap-4 hover:shadow-lg transition-all duration-300 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-extrabold text-brand-brown/50 uppercase tracking-wider">Transit Efficiency</span>
              <h4 className="text-3xl font-black text-indigo-700 font-poppins mt-2">{transitEfficiency}%</h4>
            </div>
            <div className="flex flex-col items-center">
              <svg className="w-16 h-10" viewBox="0 0 36 20">
                <path className="text-brand-forest/10" strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M3 18 A 15 15 0 0 1 33 18" />
                <path className="text-indigo-600" strokeWidth="3.5" strokeDasharray="47" strokeDashoffset={47 - (47 * (transitEfficiency / 100))} strokeLinecap="round" stroke="currentColor" fill="none" d="M3 18 A 15 15 0 0 1 33 18" />
              </svg>
            </div>
          </div>

          <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 w-fit">
            ⚡ Compared to Solo Driving
          </span>
        </div>

        {/* Card 6: Weekly Improvement */}
        <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 bg-white/40 flex flex-col justify-between h-auto min-h-fit gap-4 hover:shadow-lg transition-all duration-300 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-extrabold text-brand-brown/50 uppercase tracking-wider">Weekly Improvement</span>
              <h4 className="text-3xl font-black text-emerald-700 font-poppins mt-2">15.4%</h4>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-700 rounded-2xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 w-fit">
            📉 Carbon emissions reduced this week
          </span>
        </div>

      </div>

      {/* ── Today's Action Card ── */}
      {(() => {
        const rec = getRecommendedAction({
          carbonToday: profile.carbonToday,
          stepsToday: profile.stepsToday,
          ecohealthScore: profile.ecohealthScore,
          commutePreference: profile.commutePreference,
        });
        const iconMap = {
          walk: Footprints,
          transit: Compass,
          score: ShieldCheck,
          challenge: Trophy,
        };
        const RecIcon = iconMap[rec.icon] || Trophy;
        return (
          <div
            className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-brand-forest/15 shadow-sm bg-gradient-to-r from-brand-forest/8 via-brand-sage/5 to-white/40"
            role="complementary"
            aria-label="Recommended action"
          >
            <div className="p-2.5 bg-brand-forest text-brand-cream rounded-xl shrink-0 shadow-sm">
              <RecIcon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[8px] font-bold text-brand-forest uppercase tracking-widest leading-none mb-1">Your Next Action</span>
              <p className="text-xs text-brand-forest font-bold leading-snug">{rec.action}</p>
              <p className="text-[10px] text-brand-brown/70 mt-0.5 leading-relaxed">{rec.impact}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-forest/40 shrink-0" aria-hidden="true" />
          </div>
        );
      })()}

      {/* 3. Redesigned Public Transit Impact Center */}
      <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 bg-white/40 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-brand-forest/5 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-brand-forest/60 font-extrabold">Analytics</span>
            <h3 className="text-xl font-bold font-poppins text-brand-forest mt-0.5">Public Transit Impact</h3>
          </div>
          <button
            onClick={() => router.push("/analytics")}
            className="px-4 py-2 bg-brand-forest hover:bg-brand-forest/90 text-brand-cream text-xxs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
          >
            View Journey Analytics
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Highlights Metrics Grid (4 columns) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            <div className="p-4 bg-brand-forest/5 rounded-2xl border border-brand-forest/10 flex flex-col justify-between">
              <span className="text-xs font-bold text-brand-forest">🚆 Trips Completed</span>
              <p className="text-2xl font-black text-brand-forest font-poppins mt-2">{totalTransitTrips} trips</p>
            </div>
            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex flex-col justify-between">
              <span className="text-xs font-bold text-emerald-800">💰 Fare Saved</span>
              <p className="text-2xl font-black text-emerald-700 font-poppins mt-2">₹{profile.moneySaved}</p>
            </div>
            <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex flex-col justify-between">
              <span className="text-xs font-bold text-indigo-800">🌍 CO₂ Reduced</span>
              <p className="text-2xl font-black text-indigo-700 font-poppins mt-2">{profile.carbonSaved} kg</p>
            </div>
            <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex flex-col justify-between">
              <span className="text-xs font-bold text-amber-800">🚗 Car Rides Avoided</span>
              <p className="text-2xl font-black text-amber-700 font-poppins mt-2">{avoidedCarRides} rides</p>
            </div>
          </div>

          {/* Custom Weekly Activity Bar Chart (4 columns) */}
          <div className="lg:col-span-4 p-5 bg-white/60 rounded-3xl border border-brand-sage/10 flex flex-col justify-between h-48">
            <span className="text-[10px] font-extrabold text-brand-brown/60 uppercase">Weekly Transit Timeline</span>
            <div className="flex justify-between items-end h-28 pt-4 px-2">
              {weeklyTransitData.map((d, i) => {
                const height = Math.max(10, Math.min(100, (d.count / 4) * 100));
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 w-8">
                    <div className="text-[9px] font-bold text-brand-forest">{d.count}</div>
                    <div
                      className="w-3.5 bg-gradient-to-t from-brand-sage to-brand-forest rounded-t-md transition-all duration-700"
                      style={{ height: `${height}%` }}
                    />
                    <div className="text-[9px] font-bold text-brand-brown/50">{d.dayName}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline of recent commutes (4 columns) */}
          <div className="lg:col-span-4 p-4 bg-white/60 rounded-3xl border border-brand-sage/10 space-y-3 h-48 overflow-y-auto">
            <span className="block text-[10px] font-extrabold text-brand-brown/60 uppercase mb-2">Recent Commutes</span>
            {historyLogs.slice(0, 3).map((log, idx) => (
              <div key={log.id || idx} className="flex justify-between items-center p-2 rounded-xl bg-brand-cream/60 border border-brand-sage/5 text-xxs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-forest/10 flex items-center justify-center text-xs">
                    {log.mode.toLowerCase() === "walking" ? "🚶" : log.mode.toLowerCase() === "bicycle" ? "🚲" : "🚆"}
                  </span>
                  <div>
                    <p className="font-bold text-brand-forest capitalize">{log.mode}</p>
                    <p className="text-[9px] text-brand-brown/50">{log.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-forest">{log.distance} km</p>
                  <p className="text-[9px] text-emerald-600">-{Math.round(log.distance * 0.18)}kg CO₂</p>
                </div>
              </div>
            ))}
            {historyLogs.length === 0 && (
              <div className="text-center text-xxs text-brand-brown/40 py-8">No logged commutes found</div>
            )}
          </div>

        </div>
      </div>

      {/* Grid Layout: Progress, Score and Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Progress Section (4 cols) */}
        <div className="lg:col-span-4 self-start">
          <div className="glass-card rounded-3xl p-4 border border-brand-sage/20 bg-white/40 flex flex-col gap-2 relative overflow-hidden shadow-md">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-forest/5 rounded-full blur-2xl -z-10" />
            
            <div className="w-full flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-brand-forest/60 font-extrabold">Commute Level</span>
              <span className="text-lg">⚡</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-poppins text-brand-forest">Lvl {profile.level || 1}</span>
                <span className="text-xs font-bold text-brand-sage">{profile.ecoHealthLevel || "Eco Starter"}</span>
              </div>
              <p className="text-[10px] text-brand-brown/65 font-medium leading-tight">
                Keep choosing green transport to unlock next tier
              </p>
            </div>

            <div className="w-full space-y-1.5 border-t border-brand-forest/5 pt-2">
              <div className="flex justify-between text-[10px] font-bold text-brand-brown/70">
                <span>XP Progress</span>
                <span>{profile.xp || 0} / {(profile.level || 1) * 200} XP</span>
              </div>
              <div className="w-full bg-brand-forest/10 h-1.5 rounded-full overflow-hidden border border-brand-forest/5 shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-sage to-brand-forest rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((profile.xp || 0) / ((profile.level || 1) * 200)) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-[9px] text-brand-forest font-semibold text-right">
                {Math.max(0, ((profile.level || 1) * 200) - (profile.xp || 0))} XP until Level {(profile.level || 1) + 1}
              </p>
            </div>
          </div>
        </div>

        {/* Middle: Circular Score Gauge (4 cols) */}
        <div className="lg:col-span-4 self-start">
          <ScoreGauge score={profile.ecohealthScore} levelTitle={scoreTitle} />
        </div>
        
        {/* Right: Widgets (Leaderboard, Transit Conditions) (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 self-start">
          {/* Transit Conditions Widget */}
          <div className="glass-card rounded-3xl p-4 border border-brand-sage/20 bg-white/40 flex flex-col gap-2.5 shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-brand-forest/65 uppercase tracking-wider">Transit Conditions</span>
                <h4 className="font-bold text-xs text-brand-forest flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-brand-forest/65" />
                  {weather.city || profile.primaryLocation || "Trichy"}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 bg-brand-forest/5 border border-brand-forest/10 px-2 py-1 rounded-lg">
                <CloudSun className="w-3.5 h-3.5 text-brand-forest" />
                <span className="text-[10px] font-extrabold text-brand-forest">{weather.temp || 35.0}°C</span>
              </div>
            </div>
            
            <div className="bg-brand-forest/5 p-2 rounded-lg border border-brand-forest/10 flex justify-between items-center text-[10px]">
              <div>
                <span className="block text-[8px] font-bold text-brand-brown/50 uppercase leading-none mb-0.5">Current Sky</span>
                <span className="font-bold text-brand-forest">{weather.condition || "Sunny"}</span>
              </div>
              <span className="text-[8px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                Green Commute Day
              </span>
            </div>

            <div className="space-y-1">
              <span className="block text-[8px] font-extrabold text-brand-brown/50 uppercase tracking-wide">Commute Suitability</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(() => {
                  const temp = weather.temp || 35.0;
                  const isHot = temp > 32;
                  const isVeryHot = temp > 36;
                  
                  return (
                    <>
                      <div className="p-1 rounded-md border border-brand-sage/10 bg-white/40 flex flex-col items-center text-center">
                        <span className="text-[10px]">🚶</span>
                        <span className="text-[8px] font-bold text-brand-forest mt-0.5">Walk</span>
                        <span className={`text-[7px] font-extrabold px-1 rounded-full ${isVeryHot ? "bg-red-50 text-red-700" : isHot ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {isVeryHot ? "Poor" : isHot ? "Fair" : "Optimal"}
                        </span>
                      </div>
                      
                      <div className="p-1 rounded-md border border-brand-sage/10 bg-white/40 flex flex-col items-center text-center">
                        <span className="text-[10px]">🚲</span>
                        <span className="text-[8px] font-bold text-brand-forest mt-0.5">Cycle</span>
                        <span className={`text-[7px] font-extrabold px-1 rounded-full ${isVeryHot ? "bg-red-50 text-red-700" : isHot ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {isVeryHot ? "Poor" : isHot ? "Fair" : "Optimal"}
                        </span>
                      </div>

                      <div className="p-1 rounded-md border border-brand-sage/10 bg-white/40 flex flex-col items-center text-center">
                        <span className="text-[10px]">🚌</span>
                        <span className="text-[8px] font-bold text-brand-forest mt-0.5">Transit</span>
                        <span className="text-[7px] font-extrabold px-1 rounded-full bg-emerald-50 text-emerald-700">
                          {isHot ? "Optimal" : "Optimal"}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <p className="text-[10px] text-brand-forest font-semibold leading-relaxed border-t border-brand-forest/5 pt-2 mt-2">
              💡 {weather.tip || "Very bright day. Stay hydrated and travel via public transit."}
            </p>
          </div>

          {/* Indian Competitor Leaderboard */}
          <div className="glass-card rounded-3xl p-4 border border-brand-sage/20 flex flex-col gap-2.5 shadow-md">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-brand-forest/60 uppercase font-poppins">Green XP Leaderboard</span>
              <Trophy className="w-4 h-4 text-accent-gold" />
            </div>

            <div className="space-y-1.5">
              {leaderboard.slice(0, 4).map((userItem) => (
                <div
                  key={userItem.username}
                  className={`flex items-center justify-between p-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                    userItem.isUser
                      ? "bg-brand-forest border-brand-forest text-brand-cream"
                      : "bg-white/40 border-brand-sage/10 text-brand-brown hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                      userItem.rank === 1 ? "bg-yellow-500 text-brand-forest" : userItem.isUser ? "bg-brand-cream text-brand-forest" : "bg-brand-forest/10 text-brand-forest"
                    }`}>
                      {userItem.rank}
                    </span>
                    <span className="font-poppins truncate max-w-20">{userItem.username}</span>
                  </div>
                  <span className="text-[9px]">{userItem.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 4. Redesigned Sustainability Vault */}
      <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 bg-white/40 shadow-xl">
        <div className="flex items-center gap-2 mb-6 border-b border-brand-forest/5 pb-4">
          <Medal className="w-6 h-6 text-brand-forest" />
          <div>
            <span className="text-xs uppercase tracking-wider text-brand-forest/60 font-extrabold">Locker</span>
            <h3 className="text-xl font-bold font-poppins text-brand-forest">Sustainability Vault</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Item 1: Total Eco Points */}
          <div className="p-5 bg-gradient-to-br from-brand-forest/5 to-brand-sage/10 rounded-2xl border border-brand-sage/20 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <span className="text-[10px] font-bold text-brand-forest uppercase tracking-wide">Total Eco Points</span>
            <div className="my-2">
              <h4 className="text-3xl font-black text-brand-forest font-poppins">{dynamicEcoPoints}</h4>
              <p className="text-[9px] font-semibold text-brand-brown/60 mt-1">Accumulated from LOW-CARBON commutes</p>
            </div>
            <div className="text-[10px] font-bold text-brand-forest">
              🌱 Level 3 Forest Guardian
            </div>
          </div>

          {/* Item 2: Milestones Progress */}
          <div className="p-5 bg-white/60 rounded-2xl border border-brand-sage/10 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <span className="text-[10px] font-bold text-brand-brown/50 uppercase tracking-wide">Vault Milestones</span>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-extrabold text-brand-forest">
                  <span>Carbon Target</span>
                  <span>{profile.carbonSaved} / 50 kg</span>
                </div>
                <div className="w-full bg-brand-forest/10 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-forest" style={{ width: `${Math.min(100, (profile.carbonSaved / 50) * 100)}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-extrabold text-brand-forest">
                  <span>Streak Target</span>
                  <span>{profile.streak} / 7 days</span>
                </div>
                <div className="w-full bg-brand-forest/10 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-forest" style={{ width: `${Math.min(100, (profile.streak / 7) * 100)}%` }} />
                </div>
              </div>
            </div>
            <span className="text-[9px] font-bold text-brand-brown/50">Next: Carbon Crusher Badge</span>
          </div>

          {/* Item 3: Rewards Locker */}
          <div className="p-5 bg-white/60 rounded-2xl border border-brand-sage/10 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <span className="text-[10px] font-bold text-brand-brown/50 uppercase tracking-wide">Rewards Locker</span>
            <div className="space-y-2">
              <div className="p-2 rounded-xl bg-brand-forest/5 border border-brand-forest/10 text-xxs font-bold text-brand-forest flex justify-between items-center">
                <span>🎫 Free Metro Ride</span>
                <span className="text-[9px] bg-brand-forest text-brand-cream px-1.5 py-0.5 rounded-full">Claimed</span>
              </div>
              <div className="p-2 rounded-xl bg-brand-forest/5 border border-brand-forest/10 text-xxs font-bold text-brand-forest flex justify-between items-center opacity-70">
                <span>☕ Green Café Coupon</span>
                {profile.streak >= 5 ? (
                  <span className="text-[9px] bg-amber-500 text-brand-forest px-1.5 py-0.5 rounded-full">Available</span>
                ) : (
                  <span className="text-[9px] text-brand-brown/50">Locked</span>
                )}
              </div>
            </div>
            <span className="text-[9px] font-bold text-brand-brown/40">Streak of 5+ days unlocks café coupon</span>
          </div>

          {/* Item 4: Certificates */}
          <div className="p-5 bg-white/60 rounded-2xl border border-brand-sage/10 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <span className="text-[10px] font-bold text-brand-brown/50 uppercase tracking-wide">Carbon Certificates</span>
            <div className="text-center py-2">
              <FileText className="w-10 h-10 text-brand-forest/40 mx-auto" />
              <p className="text-[10px] font-bold text-brand-forest mt-1.5">Carbon Neutral Commuter</p>
            </div>
            <button
              onClick={() => setShowCertModal(true)}
              className="w-full py-2 bg-brand-forest hover:bg-brand-forest/90 text-brand-cream font-bold text-xxs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Open Certificate
            </button>
          </div>

        </div>
      </div>

      {/* Challenges & Daily Actions Section */}
      <div className="glass-card rounded-3xl p-6 shadow-md">
        
        {/* Tab Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-brand-forest/10">
          <div>
            <span className="text-xs uppercase tracking-wider text-brand-forest/60 font-extrabold">Gamification</span>
            <h3 className="text-xl font-bold font-poppins text-brand-forest mt-0.5">Eco Missions Cabinets</h3>
          </div>
          
          <div className="flex p-1 bg-brand-forest/5 rounded-2xl border border-brand-forest/10 select-none">
            {["daily", "weekly", "monthly"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xxs font-bold capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-brand-forest text-brand-cream shadow-sm"
                    : "text-brand-brown/70 hover:text-brand-forest"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Challenges Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {currentChallenges.map((challenge) => {
              const pct = Math.min(100, (challenge.currentValue / challenge.goalValue) * 100);
              const isClaimable = challenge.isCompleted && !challenge.isClaimed;
              
              return (
                <motion.div
                  key={challenge.id}
                  layout
                  className={`p-4 rounded-3xl border flex flex-col justify-between h-auto min-h-fit gap-3.5 transition-all duration-300 ${
                    challenge.isClaimed
                      ? "bg-brand-forest/5 border-brand-forest/10 opacity-70"
                      : isClaimable
                      ? "bg-yellow-500/5 border-yellow-500/30 ring-2 ring-yellow-500/10"
                      : "bg-white/40 border-brand-sage/25 hover:border-brand-forest/30 shadow-md hover:-translate-y-1"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h4 className="font-bold text-sm text-brand-forest font-poppins line-clamp-1">{challenge.title}</h4>
                      {challenge.isClaimed ? (
                        <span className="text-[9px] font-bold text-brand-forest bg-brand-forest/10 px-2 py-0.5 rounded-full shrink-0">Claimed</span>
                      ) : challenge.isCompleted ? (
                        <span className="text-[9px] font-bold text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-full shrink-0 animate-bounce">Ready</span>
                      ) : (
                        <span className="text-[9px] font-bold text-brand-brown/50 uppercase shrink-0">Active</span>
                      )}
                    </div>
                    <p className="text-[10px] text-brand-brown/75 leading-relaxed line-clamp-2 min-h-8">{challenge.description}</p>
                  </div>

                  <div className="my-2 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-brand-brown/60">
                      <span>Task Progress</span>
                      <span>
                        {challenge.currentValue} / {challenge.goalValue} {challenge.title.toLowerCase().includes("steps") ? "steps" : challenge.title.toLowerCase().includes("₹") ? "" : challenge.title.toLowerCase().includes("co₂") ? "kg" : ""}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-brand-forest/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-sage to-brand-forest rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-brand-forest/5 pt-3 flex items-center justify-between mt-auto">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-bold text-accent-gold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 fill-accent-gold" />
                        +{challenge.rewardXp} XP
                      </span>
                      <span className="text-[9px] font-semibold text-brand-forest mt-0.5">
                        {challenge.title.toLowerCase().includes("save") ? "Saves Fares" : `Est: -${challenge.rewardScore}kg CO₂`}
                      </span>
                    </div>
                    
                    {isClaimable ? (
                      <button
                        onClick={() => handleClaimReward(challenge.id, challenge.rewardXp, challenge.rewardScore)}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-brand-forest font-bold text-xxs rounded-xl shadow-md transition-all hover:scale-105 cursor-pointer"
                      >
                        Claim Reward
                      </button>
                    ) : challenge.isClaimed ? (
                      <span className="text-xxs font-bold text-brand-forest">Claimed! 🎉</span>
                    ) : (
                      <span className="text-xxs font-bold text-brand-brown/40">In Progress</span>
                    )}
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Dynamic Certificate Modal */}
      <AnimatePresence>
        {showCertModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCertModal(false)}
              className="absolute inset-0 bg-brand-forest/30 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full border-4 border-double border-brand-forest/40 relative z-10 shadow-2xl text-center space-y-6"
            >
              <button
                onClick={() => setShowCertModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-brand-forest/5 text-brand-brown/40 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-forest bg-brand-forest/10 px-3 py-1 rounded-full">
                  MamaGreen Carbon Registry
                </span>
                <h3 className="text-2xl font-black font-poppins text-brand-forest pt-2">
                  Certificate of Sustainability
                </h3>
                <p className="text-xxs text-brand-brown/50 uppercase tracking-widest">
                  Serial: MG-CERT-{profile.id}-{dynamicEcoPoints}
                </p>
              </div>

              <div className="border-t border-b border-brand-forest/10 py-6 my-4 space-y-4">
                <p className="text-xs text-brand-brown/80 font-medium">This document proudly certifies that</p>
                <h4 className="text-xl font-bold font-poppins text-brand-forest italic">{profile.username}</h4>
                <p className="text-xs text-brand-brown/80 leading-relaxed font-semibold max-w-sm mx-auto">
                  has achieved status <strong className="text-brand-forest font-bold">{scoreTitle}</strong> by saving a cumulative
                  total of <strong className="text-brand-forest font-bold">{profile.carbonSaved} kg of CO₂ emissions</strong> using low-carbon active transportation modes.
                </p>
              </div>

              <div className="flex justify-between items-center text-left text-xxs font-bold text-brand-brown/50 px-4">
                <div>
                  <p>MAMAGREEN ECO ADVISORY</p>
                  <p className="text-[8px] text-brand-brown/30 font-semibold mt-1">Verified via Local State Adapter</p>
                </div>
                <div className="text-right">
                  <p>DATE ISSUED</p>
                  <p className="text-[8px] text-brand-brown/30 font-semibold mt-1">{new Date().toLocaleDateString("en-IN")}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
