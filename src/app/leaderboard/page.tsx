"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Search, RefreshCw, Star, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "@/constants";

const DEFAULT_LEADERBOARD = [
  { rank: 1, username: "Priya Sharma", xp: 450, isUser: false },
  { rank: 2, username: "Rahul Verma", xp: 380, isUser: false },
  { rank: 3, username: "Green Traveler (You)", xp: 120, isUser: true },
  { rank: 4, username: "Amit Patel", xp: 90, isUser: false },
  { rank: 5, username: "Rohan Das", xp: 60, isUser: false }
];

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [backendActive, setBackendActive] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
        setBackendActive(true);
      } else {
        loadLocalLeaderboard();
      }
    } catch (err) {
      console.warn("Backend offline. Loading local leaderboard fallback.");
      loadLocalLeaderboard();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalLeaderboard = () => {
    setBackendActive(false);
    const saved = localStorage.getItem("mamagreen_stats");
    if (saved) {
      try {
        const stats = JSON.parse(saved);
        const userXp = (stats.level || 1) * 200 + (stats.xp || 0);
        
        // Update user XP in list
        const updated = DEFAULT_LEADERBOARD.map(item =>
          item.isUser
            ? { ...item, username: `${stats.fullName || "Green Traveler"} (You)`, xp: userXp }
            : item
        ).sort((a, b) => b.xp - a.xp);

        // Re-assign ranks
        updated.forEach((item, index) => {
          item.rank = index + 1;
        });

        setLeaderboard(updated);
      } catch (e) {
        setLeaderboard(DEFAULT_LEADERBOARD);
      }
    } else {
      setLeaderboard(DEFAULT_LEADERBOARD);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredLeaderboard = leaderboard.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userRankItem = leaderboard.find(item => item.isUser);
  const userRank = userRankItem ? userRankItem.rank : 3;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-brand-forest/5 p-6 rounded-3xl border border-brand-forest/10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-sage/5 rounded-full blur-3xl -z-10" />
        
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-poppins text-brand-forest tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-accent-gold fill-accent-gold" />
            Green Rankings
          </h2>
          <p className="text-xs text-brand-brown/80 mt-1 font-medium">
            See how you compare with other carbon-neutral commuters in the city.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
            backendActive 
              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
              : "bg-amber-100 text-amber-800 border-amber-300"
          }`}>
            {backendActive ? "Live Leaderboard" : "Simulated"}
          </span>
          <button
            onClick={fetchLeaderboard}
            className="p-2 bg-brand-forest text-brand-cream rounded-xl hover:bg-brand-forest/90 transition-all shadow-sm"
            title="Refresh rankings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
          
          {/* Rank 2 Podium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-5 border border-brand-sage/20 bg-white/40 flex flex-col items-center text-center order-2 md:order-1 h-44 justify-between"
          >
            <div className="relative">
              <Medal className="w-10 h-10 text-slate-400 fill-slate-100" />
              <span className="absolute -bottom-1 -right-1 bg-brand-forest text-brand-cream text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">2</span>
            </div>
            <div className="mt-2">
              <h4 className="font-bold text-xs text-brand-forest font-poppins truncate max-w-[120px]">{leaderboard[1]?.username}</h4>
              <span className="text-xs font-bold text-brand-brown/70">{leaderboard[1]?.xp} XP</span>
            </div>
            <span className="text-[9px] font-bold text-brand-forest bg-brand-forest/5 px-2 py-0.5 rounded-full mt-1">Silver Sprout</span>
          </motion.div>

          {/* Rank 1 Podium */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-6 border-2 border-accent-gold/40 bg-white/60 flex flex-col items-center text-center order-1 md:order-2 h-52 justify-between shadow-md relative"
          >
            <div className="absolute -top-3 bg-accent-gold text-brand-forest font-bold text-[9px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 uppercase tracking-wider">
              <Star className="w-3 h-3 fill-brand-forest text-brand-forest" />
              Top Commuter
            </div>
            <div className="relative mt-2">
              <Trophy className="w-12 h-12 text-accent-gold fill-accent-gold animate-float" />
              <span className="absolute -bottom-1 -right-1 bg-brand-forest text-brand-cream text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">1</span>
            </div>
            <div className="mt-2">
              <h4 className="font-extrabold text-sm text-brand-forest font-poppins truncate max-w-[150px]">{leaderboard[0]?.username}</h4>
              <span className="text-sm font-extrabold text-emerald-700">{leaderboard[0]?.xp} XP</span>
            </div>
            <span className="text-[10px] font-bold text-accent-gold bg-yellow-500/10 px-2.5 py-0.5 rounded-full mt-1 flex items-center gap-0.5">
              Forest King
            </span>
          </motion.div>

          {/* Rank 3 Podium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-5 border border-brand-sage/20 bg-white/40 flex flex-col items-center text-center order-3 h-40 justify-between"
          >
            <div className="relative">
              <Medal className="w-10 h-10 text-amber-700 fill-amber-100" />
              <span className="absolute -bottom-1 -right-1 bg-brand-forest text-brand-cream text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">3</span>
            </div>
            <div className="mt-2">
              <h4 className="font-bold text-xs text-brand-forest font-poppins truncate max-w-[120px]">{leaderboard[2]?.username}</h4>
              <span className="text-xs font-bold text-brand-brown/70">{leaderboard[2]?.xp} XP</span>
            </div>
            <span className="text-[9px] font-bold text-brand-forest bg-brand-forest/5 px-2 py-0.5 rounded-full mt-1">Bronze Sprout</span>
          </motion.div>

        </div>
      )}

      {/* Main rankings cabinet */}
      <div className="glass-card rounded-3xl p-6 border border-brand-sage/20 flex-1 flex flex-col">
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-brand-forest/10">
          <div>
            <h3 className="text-lg font-bold font-poppins text-brand-forest">All Urban Challengers</h3>
            <span className="text-[10px] text-brand-brown/65 font-semibold">Showing active competitors in India</span>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-forest/50" />
            <input
              type="text"
              placeholder="Search competitor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/50 border border-brand-sage/20 focus:border-brand-forest focus:outline-none rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-brand-brown"
            />
          </div>
        </div>

        {/* Rankings Table/List */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 text-brand-forest">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <span className="text-xs font-bold font-poppins">Loading urban statistics...</span>
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-brand-brown/50">
            <Search className="w-10 h-10 mb-2" />
            <span className="text-xs font-bold font-poppins">No urban competitors matched.</span>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto">
            {filteredLeaderboard.map((item) => (
              <div
                key={item.username}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  item.isUser
                    ? "bg-brand-forest border-brand-forest text-brand-cream shadow-md scale-[1.01]"
                    : "bg-white/40 border-brand-sage/15 hover:border-brand-forest/20 text-brand-brown hover:bg-white/70"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                    item.rank === 1
                      ? "bg-yellow-500 text-brand-forest"
                      : item.rank === 2
                      ? "bg-slate-300 text-brand-forest"
                      : item.rank === 3
                      ? "bg-amber-600/30 text-amber-900 font-bold"
                      : item.isUser
                      ? "bg-brand-cream text-brand-forest"
                      : "bg-brand-forest/5 text-brand-forest"
                  }`}>
                    {item.rank}
                  </span>
                  
                  <div className="min-w-0">
                    <span className="font-bold text-xs font-poppins block truncate">{item.username}</span>
                    <span className={`text-[9px] font-semibold ${item.isUser ? "text-brand-cream/80" : "text-brand-brown/60"}`}>
                      {item.rank <= 3 ? "Top Podiums" : "Commuter Tier"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {item.isUser && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-brand-cream/20 text-brand-cream border border-brand-cream/35 px-2 py-0.5 rounded-full shrink-0">
                      You
                    </span>
                  )}
                  <span className="text-xs font-extrabold font-poppins">{item.xp} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User context footer */}
        {!loading && (
          <div className="border-t border-brand-forest/10 pt-4 mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-[10px] text-brand-brown/65 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-brand-forest" />
              Rankings refresh dynamically as travels are logged. Keep walking!
            </span>
            <div className="text-xxs font-bold text-brand-forest bg-brand-forest/5 border border-brand-forest/10 px-3 py-1.5 rounded-xl">
              Your Rank: #{userRank} of {leaderboard.length} competitors
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
