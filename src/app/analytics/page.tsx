"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  TrendingDown,
  Activity,
  Coins,
  ShieldCheck,
  RefreshCw,
  Info,
  Calendar,
  Sparkles
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { API_BASE_URL } from "@/constants";

const MOCK_ANALYTICS = {
  emissionsTrend: [
    { day: "Fri", actual: 1.05, saved: 1.45 },
    { day: "Sat", actual: 0.60, saved: 2.10 },
    { day: "Sun", actual: 2.16, saved: 0.00 },
    { day: "Mon", actual: 0.45, saved: 1.35 },
    { day: "Tue", actual: 0.60, saved: 2.40 },
    { day: "Wed", actual: 0.00, saved: 1.80 },
    { day: "Thu", actual: 1.40, saved: 1.62 }
  ],
  fitnessTrend: [
    { day: "Fri", distance: 8.2, calories: 192 },
    { day: "Sat", distance: 13.5, calories: 340 },
    { day: "Sun", distance: 1.1, calories: 66 },
    { day: "Mon", distance: 13.0, calories: 180 },
    { day: "Tue", distance: 19.0, calories: 240 },
    { day: "Wed", distance: 10.0, calories: 400 },
    { day: "Thu", distance: 15.5, calories: 185 }
  ],
  costSavings: [
    { day: "Fri", amount: 120.0 },
    { day: "Sat", amount: 240.0 },
    { day: "Sun", amount: 0.00 },
    { day: "Mon", amount: 180.0 },
    { day: "Tue", amount: 320.0 },
    { day: "Wed", amount: 240.0 },
    { day: "Thu", amount: 150.0 }
  ],
  ecohealthTrend: [
    { day: "Fri", score: 65.0 },
    { day: "Sat", score: 68.2 },
    { day: "Sun", score: 70.5 },
    { day: "Mon", score: 72.1 },
    { day: "Tue", score: 74.0 },
    { day: "Wed", score: 76.5 },
    { day: "Thu", score: 78.5 }
  ],
  modeBreakdown: [
    { name: "Walking", value: 3 },
    { name: "Bicycle", value: 1 },
    { name: "Metro", value: 4 },
    { name: "Bus", value: 2 },
    { name: "Auto", value: 1 },
    { name: "Car", value: 1 }
  ]
};

export default function Analytics() {
  const { profile: userProfile } = useUser();
  const profile = userProfile;
  const [data, setData] = useState<any>(MOCK_ANALYTICS);
  const [backendActive, setBackendActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics`);
      if (res.ok) {
        const analyticsData = await res.json();
        if (analyticsData.emissionsTrend && analyticsData.emissionsTrend.length > 0) {
          setData(analyticsData);
        }
        setBackendActive(true);
      } else {
        setBackendActive(false);
        loadLocalAnalytics();
      }
    } catch (err) {
      setBackendActive(false);
      loadLocalAnalytics();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalAnalytics = () => {
    const savedLogs = localStorage.getItem("mamagreen_history");
    const savedStats = localStorage.getItem("mamagreen_stats");
    
    if (savedLogs) {
      const logs = JSON.parse(savedLogs);
      const stats = savedStats ? JSON.parse(savedStats) : {
        ecohealthScore: userProfile.ecohealthScore,
      };
      
      const dates = Array.from(new Set(logs.map((l: any) => l.date))).sort().slice(-7);
      
      if (dates.length >= 3) {
        const emissionsTrend: any[] = [];
        const fitnessTrend: any[] = [];
        const costSavings: any[] = [];
        const ecohealthTrend: any[] = [];

        const baseScores = [62.0, 65.4, 68.1, 70.5, 73.2, 75.8, stats.ecohealthScore];

        dates.forEach((date: any, idx: number) => {
          const dayLogs = logs.filter((l: any) => l.date === date);
          
          const actualEmissions = dayLogs.reduce((acc: number, cur: any) => acc + cur.emissions, 0);
          const totalDist = dayLogs.reduce((acc: number, cur: any) => acc + cur.distance, 0);
          const totalCal = dayLogs.reduce((acc: number, cur: any) => acc + cur.calories, 0);
          
          const carEquiv = totalDist * 0.18;
          const savedEmissions = Math.max(0, carEquiv - actualEmissions);
          const daySavedMoney = dayLogs.reduce((acc: number, cur: any) => {
            if (cur.mode !== "car") {
              const carEquivCost = cur.distance * 12.0;
              return acc + Math.max(0, carEquivCost - cur.cost);
            }
            return acc;
          }, 0);

          const dt = new Date(date + "T00:00:00");
          const dayLabel = dt.toLocaleDateString("en-US", { weekday: "short" });

          emissionsTrend.push({
            day: dayLabel,
            actual: Number(actualEmissions.toFixed(2)),
            saved: Number(savedEmissions.toFixed(2))
          });

          fitnessTrend.push({
            day: dayLabel,
            distance: Number(totalDist.toFixed(1)),
            calories: Math.round(totalCal)
          });

          costSavings.push({
            day: dayLabel,
            amount: Number(Math.max(0, daySavedMoney).toFixed(1))
          });

          const currentScore = idx === dates.length - 1 ? stats.ecohealthScore : (baseScores[idx] || 70.0);
          ecohealthTrend.push({
            day: dayLabel,
            score: Number(currentScore.toFixed(1))
          });
        });

        const modeCounts: Record<string, number> = {};
        logs.forEach((log: any) => {
          const m = log.mode.charAt(0).toUpperCase() + log.mode.slice(1);
          modeCounts[m] = (modeCounts[m] || 0) + 1;
        });
        const modeBreakdown = Object.keys(modeCounts).map(name => ({
          name,
          value: modeCounts[name]
        }));

        setData({
          emissionsTrend,
          fitnessTrend,
          costSavings,
          ecohealthTrend,
          modeBreakdown: modeBreakdown.length > 0 ? modeBreakdown : MOCK_ANALYTICS.modeBreakdown
        });
        return;
      }
    }
    setData(MOCK_ANALYTICS);
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const totalEmissionsSaved = data.emissionsTrend.reduce((acc: number, cur: any) => acc + cur.saved, 0).toFixed(1);
  const totalCaloriesBurned = data.fitnessTrend.reduce((acc: number, cur: any) => acc + cur.calories, 0);
  const totalMoneySaved = data.costSavings.reduce((acc: number, cur: any) => acc + cur.amount, 0).toFixed(1);
  const latestEcoHealth = data.ecohealthTrend[data.ecohealthTrend.length - 1]?.score || 78.5;

  const PIE_COLORS = ["#10B981", "#06B6D4", "#6366F1", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream text-brand-forest">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="font-medium font-poppins text-sm">Analyzing Emissions History...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
      
      {/* Header & Overall Summary Badges */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-brand-forest/60 font-semibold">EcoStats Dashboard</span>
          <h2 className="text-2xl md:text-3xl font-extrabold font-poppins text-brand-forest tracking-tight mt-0.5">
            Carbon & Fitness Analytics
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
            backendActive 
              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
              : "bg-amber-100 text-amber-800 border-amber-300"
          }`}>
            {backendActive ? "Live Backend Stats" : "Local Analytics Engine"}
          </span>
        </div>
      </div>

      {/* Aggregate metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Carbon saved */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-brand-forest/70">
            <span className="text-xxs font-bold uppercase">Weekly Saved</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-brand-forest">{totalEmissionsSaved}</span>
            <span className="text-[10px] font-semibold text-brand-brown/70 ml-1">kg CO₂</span>
          </div>
        </div>

        {/* Calories */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-orange-500">
            <span className="text-xxs font-bold uppercase">Weekly Burn</span>
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-orange-600">{totalCaloriesBurned}</span>
            <span className="text-[10px] font-semibold text-brand-brown/70 ml-1">kcal</span>
          </div>
        </div>

        {/* Cost saved */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-emerald-600">
            <span className="text-xxs font-bold uppercase">Weekly Savings</span>
            <Coins className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-700">₹{totalMoneySaved}</span>
            <span className="text-[10px] font-semibold text-brand-brown/70 ml-1">INR</span>
          </div>
        </div>

        {/* Rating */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-brand-forest">
            <span className="text-xxs font-bold uppercase">EcoHealth</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-brand-forest">{latestEcoHealth}</span>
            <span className="text-[10px] font-semibold text-brand-brown/70 ml-1">Score</span>
          </div>
        </div>

      </div>

      {/* Monthly Savings Progress & Mode Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Emissions Progress */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between h-80">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-brand-forest mb-2 font-poppins">
              Monthly Savings Target
            </h3>
            <p className="text-xxs text-brand-brown/75 leading-relaxed font-semibold">
              Save 50 kg of CO₂ emissions this month to unlock the legendary **Earth Protector** title and feed Sprout!
            </p>
          </div>
          
          <div className="my-4 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-extrabold text-brand-forest">
                {profile.carbonSaved || 0} <span className="text-xxs text-brand-brown/65 font-bold">/ 50 kg saved</span>
              </span>
              <span className="text-xs font-extrabold text-emerald-600">
                {Math.min(100, Math.round(((profile.carbonSaved || 0) / 50) * 100))}%
              </span>
            </div>
            
            <div className="w-full bg-brand-forest/10 rounded-full h-3.5 overflow-hidden border border-brand-forest/5 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((profile.carbonSaved || 0) / 50) * 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-linear-to-r from-emerald-500 to-brand-forest rounded-full shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-100 rounded-xl">
            <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-600 animate-pulse" />
            <span className="text-[10px] text-emerald-800 font-bold leading-tight">
              You saved {profile.carbonSaved} kg of CO₂! That's equivalent to planting {Math.round((profile.carbonSaved || 0) * 1.2)} virtual trees!
            </span>
          </div>
        </div>

        {/* Travel Mode Breakdown Pie Chart */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between h-80 lg:col-span-2">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-brand-forest mb-1 font-poppins">
              Commute Share Breakdown
            </h3>
            <p className="text-xxs text-brand-brown/60 mb-2 font-medium">
              Distribution of transport modes from logged travel history
            </p>
          </div>
          <div className="flex-1 w-full flex flex-col sm:flex-row items-center justify-around gap-2">
            <div className="w-1/2 h-full min-h-35 max-h-45">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.modeBreakdown || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(data.modeBreakdown || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-bold text-brand-forest/90 pr-4">
              {(data.modeBreakdown || []).map((entry: any, index: number) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full block shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                  <span className="capitalize">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
      </div>

      {/* Charts Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 1: Carbon footprint trend */}
        <div className="glass-card rounded-3xl p-6 flex flex-col h-80">
          <h3 className="font-bold text-xs uppercase tracking-wider text-brand-forest mb-4 font-poppins">
            Emissions Footprint Trend
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.emissionsTrend}>
                <defs>
                  <linearGradient id="colorSaved" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="5%" stopColor="#8FAF8F" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#8FAF8F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="day" stroke="#6B4F3A" style={{ fontSize: 10, fontWeight: "bold" }} />
                <YAxis stroke="#6B4F3A" style={{ fontSize: 10, fontWeight: "bold" }} unit="kg" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                <Legend style={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="saved" name="CO₂ Saved" stroke="#2E5E4E" fillOpacity={1} fill="url(#colorSaved)" strokeWidth={2} />
                <Area type="monotone" dataKey="actual" name="CO₂ Emitted" stroke="#F43F5E" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fitness (Distance vs Calories) */}
        <div className="glass-card rounded-3xl p-6 flex flex-col h-80">
          <h3 className="font-bold text-xs uppercase tracking-wider text-brand-forest mb-4 font-poppins">
            Active Distance & Energy Burn
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.fitnessTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="day" stroke="#6B4F3A" style={{ fontSize: 10, fontWeight: "bold" }} />
                <YAxis stroke="#6B4F3A" style={{ fontSize: 10, fontWeight: "bold" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="distance" name="Distance (km)" fill="#8FAF8F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="calories" name="Calories (kcal)" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Weekly financial cost savings */}
        <div className="glass-card rounded-3xl p-6 flex flex-col h-80">
          <h3 className="font-bold text-xs uppercase tracking-wider text-brand-forest mb-4 font-poppins">
            Financial Transit Cost Saved
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.costSavings}>
                <defs>
                  <linearGradient id="colorCost" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="day" stroke="#6B4F3A" style={{ fontSize: 10, fontWeight: "bold" }} />
                <YAxis stroke="#6B4F3A" style={{ fontSize: 10, fontWeight: "bold" }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                <Area type="monotone" dataKey="amount" name="Money Saved (₹)" stroke="#D4AF37" fillOpacity={1} fill="url(#colorCost)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: EcoHealth Score Progress */}
        <div className="glass-card rounded-3xl p-6 flex flex-col h-80">
          <h3 className="font-bold text-xs uppercase tracking-wider text-brand-forest mb-4 font-poppins">
            EcoHealth Score Trend
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.ecohealthTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="day" stroke="#6B4F3A" style={{ fontSize: 10, fontWeight: "bold" }} />
                <YAxis stroke="#6B4F3A" domain={[50, 100]} style={{ fontSize: 10, fontWeight: "bold" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                <Line type="monotone" dataKey="score" name="EcoHealth Score" stroke="#2E5E4E" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#FAF8F3" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Helpful Hint banner */}
      <div className="p-4 bg-brand-forest/5 rounded-3xl border border-brand-forest/10 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-accent-gold fill-accent-gold" />
        <p className="text-xxs text-brand-forest/85 leading-snug">
          <strong>Tip:</strong> Your EcoHealth score rises faster when you maintain a streak of low-carbon trips and active steps. Keep logging commutes in the **Mobility Tracker** to maintain your streak!
        </p>
      </div>

    </div>
  );
}
