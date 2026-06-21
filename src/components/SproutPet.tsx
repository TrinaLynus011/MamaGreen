"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Heart, Activity, Sparkles, Smile, BatteryCharging, Battery } from "lucide-react";

interface SproutPetProps {
  level: number;
  mood: string;
  evolutionStage: string;
  xp: number;
  xpNextLevel: number;
  energy?: number; // Mascot energy (0-100%)
}

export default function SproutPet({
  level,
  mood,
  evolutionStage,
  xp,
  xpNextLevel,
  energy = 100
}: SproutPetProps) {
  const controls = useAnimation();
  const [blink, setBlink] = useState(false);

  // Periodic blink timer
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleInteract = async () => {
    await controls.start({
      y: [0, -25, 0],
      scaleX: [1, 0.9, 1.1, 1],
      scaleY: [1, 1.1, 0.9, 1],
      transition: { duration: 0.5, ease: "easeInOut" },
    });
  };

  const getMoodColor = () => {
    switch (mood.toLowerCase()) {
      case "thriving":
        return "text-amber-600 bg-amber-500/10 border-amber-500/30";
      case "happy":
        return "text-brand-forest bg-brand-forest/10 border-brand-forest/20";
      case "sleepy":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "sad":
        return "text-rose-600 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-brand-brown bg-brand-forest/5 border-brand-forest/10";
    }
  };

  const getMoodEmoji = () => {
    switch (mood.toLowerCase()) {
      case "thriving":
        return "✨ Thriving";
      case "happy":
        return "😊 Happy";
      case "sleepy":
        return "💤 Sleepy";
      case "sad":
        return "😢 Sad";
      default:
        return "😐 Neutral";
    }
  };

  const isSleepy = mood.toLowerCase() === "sleepy";
  const isSad = mood.toLowerCase() === "sad";
  const isThriving = mood.toLowerCase() === "thriving";

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col items-center relative overflow-hidden">
      {/* Background radial glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl -z-10 transition-colors duration-500 ${
        isThriving ? "bg-amber-400/20" : isSleepy ? "bg-blue-400/10" : isSad ? "bg-rose-400/10" : "bg-brand-sage/15"
      }`} />

      {/* Header Info */}
      <div className="w-full flex justify-between items-center mb-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-brand-forest/60 font-semibold">Eco Mascot</span>
          <h3 className="text-xl font-bold font-poppins text-brand-forest">Sprout</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${getMoodColor()}`}>
          {getMoodEmoji()}
        </span>
      </div>

      {/* Mascot Render Box */}
      <motion.div
        className="w-48 h-48 cursor-pointer flex items-center justify-center relative select-none"
        onClick={handleInteract}
        animate={controls}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {/* Floating "Zzz" bubbles if sleepy */}
        {isSleepy && (
          <div className="absolute right-6 top-6 flex flex-col gap-1 pointer-events-none">
            <motion.span animate={{ y: [-5, -20], x: [0, 5], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0 }} className="text-xs font-bold text-blue-500">Z</motion.span>
            <motion.span animate={{ y: [-5, -15], x: [0, -5], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.6 }} className="text-sm font-bold text-blue-500">z</motion.span>
            <motion.span animate={{ y: [-5, -12], x: [0, 3], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 1.2 }} className="text-xxs font-bold text-blue-500">z</motion.span>
          </div>
        )}

        {/* Floating golden sparkles if thriving */}
        {isThriving && (
          <div className="absolute inset-0 pointer-events-none">
            <motion.div animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute top-4 left-6 text-yellow-500">✨</motion.div>
            <motion.div animate={{ scale: [1.2, 0.8, 1.2], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-6 right-6 text-yellow-500">✨</motion.div>
            <motion.div animate={{ scale: [0.5, 1, 0.5], opacity: [0.2, 0.8, 0.2] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute top-1/2 right-4 text-yellow-500">✨</motion.div>
          </div>
        )}

        {/* Stage 1: Seed */}
        {evolutionStage.toLowerCase() === "seed" && (
          <motion.svg
            width="140"
            height="140"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ scaleY: [1, 1.04, 1], translateY: [0, -2, 0] }}
            transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
          >
            <ellipse cx="50" cy="85" rx="30" ry="8" fill="#5c4033" fillOpacity="0.8" />
            <ellipse cx="50" cy="83" rx="22" ry="6" fill="#3d2b1f" />
            
            <path
              d="M50 40 C65 60, 68 80, 50 85 C32 80, 35 60, 50 40 Z"
              fill={isSad ? "#8a7b73" : "#6B4F3A"}
              stroke="#5c4033"
              strokeWidth="2"
            />
            
            {/* Seed Face */}
            {!isSleepy ? (
              <>
                {isSad ? (
                  <>
                    <path d="M41 68 Q43 65 45 68" stroke="#FAF8F3" strokeWidth="2" strokeLinecap="round" />
                    <path d="M55 68 Q57 65 59 68" stroke="#FAF8F3" strokeWidth="2" strokeLinecap="round" />
                    <path d="M48 74 Q50 71 52 74" stroke="#FAF8F3" strokeWidth="1.5" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <circle cx="43" cy="68" r="2.5" fill="#FAF8F3" />
                    <circle cx="57" cy="68" r="2.5" fill="#FAF8F3" />
                    {blink && (
                      <>
                        <line x1="40" y1="68" x2="46" y2="68" stroke="#6B4F3A" strokeWidth="2" />
                        <line x1="54" y1="68" x2="60" y2="68" stroke="#6B4F3A" strokeWidth="2" />
                      </>
                    )}
                    <path d="M48 73 Q50 75 52 73" stroke="#FAF8F3" strokeWidth="1.5" strokeLinecap="round" />
                  </>
                )}
              </>
            ) : (
              <>
                <path d="M40 68 Q43 71 46 68" stroke="#FAF8F3" strokeWidth="2" strokeLinecap="round" />
                <path d="M54 68 Q57 71 60 68" stroke="#FAF8F3" strokeWidth="2" strokeLinecap="round" />
                <path d="M48 74 Q50 75 52 74" stroke="#FAF8F3" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}
            
            {/* Tiny green sparkle (future sprout) */}
            <motion.path
              d="M50 40 Q52 35 54 36 Q50 32 50 40"
              fill={isThriving ? "#4CAF50" : "#8FAF8F"}
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
          </motion.svg>
        )}

        {/* Stage 2: Sprout */}
        {evolutionStage.toLowerCase() === "sprout" && (
          <motion.svg
            width="150"
            height="150"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ scaleY: [1, 1.05, 1], translateY: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
          >
            <ellipse cx="50" cy="85" rx="35" ry="9" fill="#5c4033" fillOpacity="0.8" />
            <ellipse cx="50" cy="83" rx="26" ry="6" fill="#3d2b1f" />
            <path d="M50 85 C48 70, 52 50, 50 35" stroke="#6B4F3A" strokeWidth="6" strokeLinecap="round" />
            
            <motion.path
              d="M49 45 C35 45, 25 35, 30 25 C42 22, 47 35, 49 45 Z"
              fill={isThriving ? "#4CAF50" : "#2E5E4E"}
              stroke="#1b3b30"
              strokeWidth="1.5"
              style={{ originX: "49px", originY: "45px" }}
              animate={{ rotate: [-6, 4, -6] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
            <motion.path
              d="M51 40 C65 38, 75 28, 70 18 C58 18, 53 30, 51 40 Z"
              fill={isThriving ? "#C6FF7E" : "#8FAF8F"}
              stroke="#6b8e6b"
              strokeWidth="1.5"
              style={{ originX: "51px", originY: "40px" }}
              animate={{ rotate: [-3, 7, -3] }}
              transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
            />
            
            <path
              d="M50 50 C62 50, 68 62, 65 72 C62 82, 38 82, 35 72 C32 62, 38 50, 50 50 Z"
              fill={isSad ? "#a8bda8" : "#8FAF8F"}
              stroke="#6b8e6b"
              strokeWidth="2"
            />
            
            {/* Sprout Face */}
            {!isSleepy ? (
              <>
                {isSad ? (
                  <>
                    <path d="M42 63 Q44 60 46 63" stroke="#2E5E4E" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M54 63 Q56 60 58 63" stroke="#2E5E4E" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M47 70 Q50 67 53 70" stroke="#2E5E4E" strokeWidth="2.5" strokeLinecap="round" />
                  </>
                ) : isThriving ? (
                  <>
                    <path d="M42 62 Q45 65 48 62" stroke="#2E5E4E" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M52 62 Q55 65 58 62" stroke="#2E5E4E" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="39" cy="65" r="3" fill="#E8A7A1" />
                    <circle cx="61" cy="65" r="3" fill="#E8A7A1" />
                    <path d="M47 67 C47 72, 53 72, 53 67 Z" fill="#E8A7A1" stroke="#2E5E4E" strokeWidth="1.5" />
                  </>
                ) : (
                  <>
                    <circle cx="44" cy="63" r="3" fill="#2E5E4E" />
                    <circle cx="56" cy="63" r="3" fill="#2E5E4E" />
                    {blink && (
                      <>
                        <circle cx="44" cy="63" r="3.5" fill="#8FAF8F" />
                        <circle cx="56" cy="63" r="3.5" fill="#8FAF8F" />
                      </>
                    )}
                    <circle cx="39" cy="66" r="2.5" fill="#E8A7A1" fillOpacity="0.8" />
                    <circle cx="61" cy="66" r="2.5" fill="#E8A7A1" fillOpacity="0.8" />
                    <path d="M48 67 Q50 70 52 67" stroke="#2E5E4E" strokeWidth="2" strokeLinecap="round" />
                  </>
                )}
              </>
            ) : (
              <>
                <path d="M41 64 Q44 67 47 64" stroke="#2E5E4E" strokeWidth="2" strokeLinecap="round" />
                <path d="M53 64 Q56 67 59 64" stroke="#2E5E4E" strokeWidth="2" strokeLinecap="round" />
                <path d="M48 69 Q50 71 52 69" stroke="#2E5E4E" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}
          </motion.svg>
        )}

        {/* Stage 3: Sapling */}
        {evolutionStage.toLowerCase() === "sapling" && (
          <motion.svg
            width="160"
            height="160"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ scaleY: [1, 1.04, 1], translateY: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          >
            <ellipse cx="50" cy="85" rx="38" ry="8" fill="#5c4033" fillOpacity="0.6" />
            <path
              d="M44 85 C42 65, 45 40, 50 40 C55 40, 58 65, 56 85 Z"
              fill={isSad ? "#826e60" : "#6B4F3A"}
              stroke="#5c4033"
              strokeWidth="2"
            />
            
            <motion.path
              d="M45 58 C35 55, 28 48, 25 52"
              stroke="#6B4F3A"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ originX: "45px", originY: "58px" }}
              animate={{ rotate: isThriving ? [-15, 15, -15] : [-8, 8, -8] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            />
            <path d="M25 52 Q22 47 20 52 Q23 55 25 52" fill={isThriving ? "#C6FF7E" : "#8FAF8F"} />
            
            <motion.path
              d="M55 58 C65 55, 72 48, 75 52"
              stroke="#6B4F3A"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ originX: "55px", originY: "58px" }}
              animate={{ rotate: isThriving ? [15, -15, 15] : [8, -8, 8] }}
              transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }}
            />
            <path d="M75 52 Q78 47 80 52 Q77 55 75 52" fill="#2E5E4E" />

            <motion.g
              style={{ originX: "50px", originY: "40px" }}
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            >
              <circle cx="50" cy="32" r="16" fill="#2E5E4E" />
              <circle cx="38" cy="35" r="12" fill={isThriving ? "#4CAF50" : "#8FAF8F"} />
              <circle cx="62" cy="35" r="12" fill={isThriving ? "#4CAF50" : "#8FAF8F"} />
              <circle cx="50" cy="22" r="10" fill={isThriving ? "#C6FF7E" : "#4CAF50"} />
            </motion.g>
            
            {/* Sapling Face */}
            {!isSleepy ? (
              <>
                {isSad ? (
                  <>
                    <path d="M44 54 Q46 51 48 54" stroke="#FAF8F3" strokeWidth="2" strokeLinecap="round" />
                    <path d="M52 54 Q54 51 56 54" stroke="#FAF8F3" strokeWidth="2" strokeLinecap="round" />
                    <path d="M47 60 Q50 58 53 60" stroke="#FAF8F3" strokeWidth="2" strokeLinecap="round" />
                  </>
                ) : isThriving ? (
                  <>
                    <path d="M44 52 Q47 55 50 52" stroke="#FAF8F3" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M52 52 Q55 55 58 52" stroke="#FAF8F3" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="41" cy="56" r="2" fill="#E8A7A1" />
                    <circle cx="59" cy="56" r="2" fill="#E8A7A1" />
                    <path d="M47 58 C47 62, 53 62, 53 58 Z" fill="#FAF8F3" />
                  </>
                ) : (
                  <>
                    <circle cx="46" cy="55" r="2.5" fill="#FAF8F3" />
                    <circle cx="54" cy="55" r="2.5" fill="#FAF8F3" />
                    {blink && (
                      <>
                        <line x1="43" y1="55" x2="49" y2="55" stroke="#FAF8F3" strokeWidth="2" />
                        <line x1="51" y1="55" x2="57" y2="55" stroke="#FAF8F3" strokeWidth="2" />
                      </>
                    )}
                    <circle cx="42" cy="58" r="1.5" fill="#E8A7A1" />
                    <circle cx="58" cy="58" r="1.5" fill="#E8A7A1" />
                    <path d="M48 60 Q50 62 52 60" stroke="#FAF8F3" strokeWidth="1.5" strokeLinecap="round" />
                  </>
                )}
              </>
            ) : (
              <>
                <path d="M43 54 Q46 56 49 54" stroke="#FAF8F3" strokeWidth="2" strokeLinecap="round" />
                <path d="M51 54 Q54 56 57 54" stroke="#FAF8F3" strokeWidth="2" strokeLinecap="round" />
                <path d="M48 59 Q50 61 52 59" stroke="#FAF8F3" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}
          </motion.svg>
        )}

        {/* Stage 4: Tree Spirit / Forest Guardian */}
        {evolutionStage.toLowerCase() === "tree spirit" && (
          <motion.svg
            width="170"
            height="170"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ scale: [1, 1.03, 1], translateY: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          >
            <ellipse cx="50" cy="88" rx="28" ry="6" fill="#2E5E4E" fillOpacity="0.15" />
            <path
              d="M38 85 C35 70, 36 50, 42 36 C45 30, 55 30, 58 36 C64 50, 65 70, 62 85 Z"
              fill={isSad ? "#756356" : "#6B4F3A"}
              stroke="#5c4033"
              strokeWidth="2.5"
            />
            <path d="M50 78 C52 75, 48 70, 50 65" stroke="#3d2b1f" strokeWidth="2" strokeLinecap="round" />
            <path d="M46 45 C44 48, 48 50, 47 53" stroke="#3d2b1f" strokeWidth="1.5" strokeLinecap="round" />

            <polygon points="50,42 53,46 50,50 47,46" fill="#D4AF37" />
            <circle cx="50" cy="46" r="1.5" fill="#FAF8F3" />
            <motion.circle
              cx="50"
              cy="46"
              r="4"
              stroke="#D4AF37"
              strokeWidth="0.5"
              animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            
            <path d="M40 33 L28 20 C25 22, 28 26, 33 28" stroke="#6B4F3A" strokeWidth="3" strokeLinecap="round" />
            <path d="M60 33 L72 20 C75 22, 72 26, 67 28" stroke="#6B4F3A" strokeWidth="3" strokeLinecap="round" />
            
            <motion.g
              style={{ originX: "50px", originY: "30px" }}
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <ellipse cx="50" cy="22" rx="28" ry="16" fill="#2E5E4E" />
              <circle cx="30" cy="22" r="14" fill={isThriving ? "#4CAF50" : "#8FAF8F"} />
              <circle cx="70" cy="22" r="14" fill={isThriving ? "#4CAF50" : "#8FAF8F"} />
              <circle cx="40" cy="12" r="12" fill={isThriving ? "#C6FF7E" : "#4CAF50"} />
              <circle cx="60" cy="12" r="12" fill={isThriving ? "#C6FF7E" : "#4CAF50"} />
              <circle cx="50" cy="14" r="5" fill="#D4AF37" />
            </motion.g>

            {/* Tree Spirit Face */}
            {!isSleepy ? (
              <>
                {isSad ? (
                  <>
                    <path d="M42 53 Q44 50 46 53" stroke="#FAF8F3" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M54 53 Q56 50 58 53" stroke="#FAF8F3" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M48 62 Q50 59 52 62" stroke="#FAF8F3" strokeWidth="2.5" strokeLinecap="round" />
                  </>
                ) : isThriving ? (
                  <>
                    <path d="M41 51 Q44 54 47 51" stroke="#FAF8F3" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M53 51 Q56 54 59 51" stroke="#FAF8F3" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="37" cy="56" r="3" fill="#E8A7A1" />
                    <circle cx="63" cy="56" r="3" fill="#E8A7A1" />
                    <path d="M46 57 C46 63, 54 63, 54 57 Z" fill="#FAF8F3" />
                  </>
                ) : (
                  <>
                    <circle cx="44" cy="54" r="4" fill="#D4AF37" />
                    <circle cx="56" cy="54" r="4" fill="#D4AF37" />
                    <circle cx="43" cy="53" r="1.5" fill="#FAF8F3" />
                    <circle cx="55" cy="53" r="1.5" fill="#FAF8F3" />
                    {blink && (
                      <>
                        <circle cx="44" cy="54" r="4" fill="#6B4F3A" />
                        <circle cx="56" cy="54" r="4" fill="#6B4F3A" />
                      </>
                    )}
                    <circle cx="38" cy="59" r="2.5" fill="#E8A7A1" fillOpacity="0.8" />
                    <circle cx="62" cy="59" r="2.5" fill="#E8A7A1" fillOpacity="0.8" />
                    <path d="M48 60 Q50 63 52 60" stroke="#FAF8F3" strokeWidth="2" strokeLinecap="round" />
                  </>
                )}
              </>
            ) : (
              <>
                <path d="M41 53 Q44 56 47 53" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" />
                <path d="M53 53 Q56 56 59 53" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" />
                <path d="M48 60 Q50 62 52 60" stroke="#FAF8F3" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
          </motion.svg>
        )}
      </motion.div>

      {/* Mascot Status details */}
      <div className="w-full text-center mt-3 space-y-3">
        <h4 className="text-sm font-semibold text-brand-forest">
          {evolutionStage} <span className="text-xs text-brand-forest/60">(Level {level})</span>
        </h4>
        
        {/* Energy Bar Indicator */}
        <div className="w-full bg-brand-forest/5 border border-brand-forest/5 p-2.5 rounded-2xl flex items-center justify-between text-xxs font-bold">
          <span className="flex items-center gap-1.5 text-brand-brown/80">
            {energy > 50 ? (
              <BatteryCharging className="w-4 h-4 text-emerald-500 animate-pulse" />
            ) : (
              <Battery className="w-4 h-4 text-rose-500" />
            )}
            Mascot Energy
          </span>
          <div className="flex items-center gap-2 flex-1 ml-4 justify-end">
            <div className="w-24 h-2 bg-brand-forest/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${energy > 50 ? "bg-emerald-500" : energy > 30 ? "bg-amber-500" : "bg-rose-500"}`}
                initial={{ width: 0 }}
                animate={{ width: `${energy}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className={energy > 50 ? "text-emerald-700" : energy > 30 ? "text-amber-700" : "text-rose-700"}>
              {energy}%
            </span>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="w-full">
          <div className="flex justify-between text-xxs font-semibold text-brand-brown/70 mb-1 px-1">
            <span>Pet Experience</span>
            <span>{xp} / {xpNextLevel} XP</span>
          </div>
          <div className="w-full h-2 bg-brand-forest/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-sage to-brand-forest rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(xp / xpNextLevel) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
      
      {/* Help Hint banner */}
      <div className="mt-4 w-full flex items-center gap-2 p-2 bg-brand-forest/5 rounded-xl border border-brand-forest/10">
        <Heart className="w-4 h-4 text-brand-forest animate-pulse" />
        <span className="text-xxs text-brand-forest/80 text-left leading-snug">
          Logging walking or public transit increases Sprout's energy and triggers Thriving states. Car trips drain their energy!
        </span>
      </div>
    </div>
  );
}
