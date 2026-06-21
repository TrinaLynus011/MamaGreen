"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Leaf } from "lucide-react";

interface ScoreGaugeProps {
  score: number;
  levelTitle: string;
}

export default function ScoreGauge({ score, levelTitle }: ScoreGaugeProps) {
  const radius = 65;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getTierColor = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("champion")) {
      return "from-amber-100 to-yellow-200 text-amber-900 bg-amber-500/10 border-amber-500/30";
    } else if (t.includes("saver")) {
      return "from-emerald-100 to-emerald-200 text-emerald-900 bg-emerald-500/10 border-emerald-500/30";
    } else if (t.includes("traveler")) {
      return "from-blue-100 to-blue-200 text-blue-900 bg-blue-500/10 border-blue-500/30";
    } else if (t.includes("explorer")) {
      return "from-teal-100 to-teal-200 text-teal-900 bg-teal-500/10 border-teal-500/30";
    } else if (t.includes("commuter")) {
      return "from-green-100 to-green-200 text-green-900 bg-green-500/10 border-green-500/30";
    } else {
      return "from-gray-100 to-gray-200 text-gray-900 bg-gray-500/10 border-gray-500/30";
    }
  };

  return (
    <div className="glass-card rounded-3xl p-4 flex flex-col items-center gap-2 relative overflow-hidden shadow-md h-fit">
      {/* Glow background */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-forest/5 rounded-full blur-2xl -z-10" />

      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-brand-forest/60 font-extrabold">EcoHealth Status</span>
          <h3 className="text-xs font-bold font-poppins text-brand-forest">Emissions Rating</h3>
        </div>
        <ShieldCheck className="w-5 h-5 text-brand-forest" />
      </div>

      {/* Circular Progress Gauge */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg width="96" height="96" className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx="48"
            cy="48"
            r="38"
            fill="transparent"
            stroke="rgba(46, 94, 78, 0.08)"
            strokeWidth="7"
          />
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8FAF8F" />
              <stop offset="100%" stopColor="#2E5E4E" />
            </linearGradient>
          </defs>
          {/* Animated score circle */}
          <motion.circle
            cx="48"
            cy="48"
            r="38"
            fill="transparent"
            stroke="url(#scoreGradient)"
            strokeWidth="7"
            strokeDasharray={238.76}
            initial={{ strokeDashoffset: 238.76 }}
            animate={{ strokeDashoffset: 238.76 - (score / 100) * 238.76 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Text displaying Score */}
        <div className="absolute flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-extrabold font-poppins text-brand-forest tracking-tight"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {score}
          </motion.span>
          <span className="text-[7px] font-bold uppercase tracking-widest text-brand-forest/60">Rating</span>
        </div>
      </div>

      {/* Tier Badge directly below the ring */}
      <div className="w-full flex flex-col items-center">
        <span className="text-[8px] text-brand-forest/70 font-bold uppercase tracking-wider mb-0.5">Current Tier</span>
        <motion.div
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[10px] font-bold font-poppins shadow-sm bg-gradient-to-r transition-all duration-300 ${getTierColor(
            levelTitle
          )}`}
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Leaf className="w-3 h-3 text-emerald-800" />
          <span className="bg-gradient-to-r from-emerald-950 via-brand-forest to-emerald-900 bg-clip-text text-transparent">
            {levelTitle}
          </span>
        </motion.div>
      </div>
    </div>
  );
}
