"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Leaf,
  Navigation,
  Compass,
  Camera,
  MessageCircle,
  Award,
  ArrowRight,
  TrendingUp,
  Heart
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      title: "Active Mobility Tracker",
      desc: "Log walking, cycling, bus, or train rides. Automatically calculate carbon saved, calories burned, and fuel costs.",
      icon: Navigation,
      color: "text-emerald-600 bg-emerald-50"
    },
    {
      title: "Route Comparison Engine",
      desc: "Compare carbon footprint, travel time, and costs across all modes of transport to choose the greenest commute.",
      icon: Compass,
      color: "text-teal-600 bg-teal-50"
    },
    {
      title: "GreenLens AI Scanner",
      desc: "Snap photos of meals, transit methods, or everyday purchases. Our vision AI calculates environmental footprints and suggests greener alternatives.",
      icon: Camera,
      color: "text-amber-600 bg-amber-50"
    },
    {
      title: "AI Eco Coach 'Mama'",
      desc: "Chat with Mama for personalized, hyper-local recommendations, fitness goals, and carbon reduction advice.",
      icon: MessageCircle,
      color: "text-blue-600 bg-blue-50"
    },
    {
      title: "Sprout Virtual Pet",
      desc: "Nurture your own eco mascot. Sprout grows, shifts, and evolves in response to your real-world carbon reduction choices.",
      icon: Leaf,
      color: "text-brand-forest bg-brand-sage/20"
    },
    {
      title: "Gamified Challenges",
      desc: "Earn Green XP, claim streaks, and unlock unique badges like Public Transport Hero or Forest Guardian.",
      icon: Award,
      color: "text-yellow-600 bg-yellow-50"
    }
  ];

  return (
    <div className="relative min-h-screen flex flex-col bg-brand-cream overflow-hidden">
      {/* Decorative background leaves using CSS sway */}
      <div className="absolute top-20 -left-10 w-40 h-40 bg-brand-sage/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-10 w-60 h-60 bg-brand-forest/5 rounded-full blur-3xl" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-6 py-2 md:py-4 relative z-10">
        
        {/* Header */}
        <header className="flex justify-between items-center py-2">
          <Link href="/" className="flex items-center gap-2">
            <img src="/assets/MamaGreen-logo.png" alt="MamaGreen Logo" className="h-14 md:h-16 object-contain" />
          </Link>
        </header>

        {/* Hero Section */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-4 md:py-6">
          
          {/* Hero Content */}
          <div className="flex flex-col text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="px-3 py-1 rounded-full text-xxs font-extrabold uppercase tracking-widest bg-brand-forest/15 text-brand-forest mb-4 inline-block">
                🌱 Active Sustainability & Fitness
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-poppins text-brand-forest leading-tight tracking-tight">
                Every Step You Take <br />
                <span className="text-accent-leaf bg-gradient-to-r from-brand-forest to-accent-leaf bg-clip-text text-transparent">
                  Makes Earth Greener
                </span>
              </h1>
            </motion.div>

            <motion.div
              className="mt-6 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-forest/10 flex items-center justify-center font-bold text-xs text-brand-forest">✓</div>
                <p className="text-base text-brand-brown/80 font-medium">Track your footprint with precision.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-forest/10 flex items-center justify-center font-bold text-xs text-brand-forest">✓</div>
                <p className="text-base text-brand-brown/80 font-medium">Improve your fitness and health daily.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-forest/10 flex items-center justify-center font-bold text-xs text-brand-forest">✓</div>
                <p className="text-base text-brand-brown/80 font-medium">Reduce your emissions systematically.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-forest/10 flex items-center justify-center font-bold text-xs text-brand-forest">✓</div>
                <p className="text-base text-brand-brown/80 font-medium">Save money on transport costs.</p>
              </div>
            </motion.div>

            <motion.div
              className="mt-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-forest hover:bg-brand-forest/90 text-brand-cream font-bold font-poppins rounded-2xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 text-xs md:text-sm group"
                >
                  Start Journey
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-sage hover:bg-brand-sage/95 text-brand-forest font-bold font-poppins rounded-2xl shadow-sm hover:shadow transition-all hover:-translate-y-0.5 text-xs md:text-sm"
                >
                  Try Demo
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Hero Illustration: Animated Earth */}
          <motion.div
            className="flex items-center justify-center relative select-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {/* Spinning background stars/dust glow */}
            <div className="absolute w-72 h-72 rounded-full bg-accent-leaf/10 blur-3xl animate-pulse-slow" />
            
            <div className="w-[300px] h-[300px] md:w-[350px] md:h-[350px] relative">
              <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                {/* Space background ring */}
                <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(46, 94, 78, 0.05)" strokeWidth="1" />
                
                {/* Orbiting items */}
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                  style={{ originX: "100px", originY: "100px" }}
                >
                  {/* Orbiting Bicycle Icon (represented as green circle with leaf) */}
                  <circle cx="100" cy="18" r="12" fill="#FAF8F3" stroke="#8FAF8F" strokeWidth="1.5" />
                  <path d="M97 18 L103 18 M95 21 L105 21 M100 13 L100 18" stroke="#2E5E4E" strokeWidth="1.5" />
                  <circle cx="97" cy="20" r="3" stroke="#2E5E4E" strokeWidth="1" />
                  <circle cx="103" cy="20" r="3" stroke="#2E5E4E" strokeWidth="1" />
                  
                  {/* Orbiting Walking Footprint Icon */}
                  <circle cx="182" cy="100" r="12" fill="#FAF8F3" stroke="#8FAF8F" strokeWidth="1.5" />
                  <circle cx="178" cy="98" r="2.5" fill="#6B4F3A" />
                  <circle cx="184" cy="102" r="2.5" fill="#6B4F3A" />
                  <ellipse cx="180" cy="104" rx="2.5" ry="1.5" fill="#6B4F3A" />
                  <ellipse cx="184" cy="96" rx="2" ry="1" fill="#6B4F3A" />
                  
                  {/* Orbiting Wind Turbine */}
                  <circle cx="100" cy="182" r="12" fill="#FAF8F3" stroke="#8FAF8F" strokeWidth="1.5" />
                  <line x1="100" y1="182" x2="100" y2="190" stroke="#2E5E4E" strokeWidth="1.5" />
                  {/* Animated Blades */}
                  <motion.g
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    style={{ originX: "100px", originY: "182px" }}
                  >
                    <line x1="100" y1="182" x2="100" y2="176" stroke="#2E5E4E" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="100" y1="182" x2="105" y2="185" stroke="#2E5E4E" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="100" y1="182" x2="95" y2="185" stroke="#2E5E4E" strokeWidth="1.5" strokeLinecap="round" />
                  </motion.g>
                </motion.g>
                
                {/* Earth Sphere - Deep forest base */}
                <circle cx="100" cy="100" r="62" fill="#2E5E4E" />
                
                {/* Earth Continent Map - Sage Green */}
                <motion.path
                  d="M70 70 Q80 50 100 55 Q120 60 125 75 Q135 90 120 115 Q100 135 85 125 Q65 115 58 100 Q55 85 70 70 Z
                     M125 50 Q130 40 145 42 Q150 50 148 65 Q135 70 130 60 Q120 55 125 50 Z
                     M65 130 Q70 125 78 132 Q74 140 68 138 Z"
                  fill="#8FAF8F"
                  animate={{
                    scale: [1, 1.02, 1],
                    rotate: [0, 2, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
                  style={{ originX: "100px", originY: "100px" }}
                />
                
                {/* Orbiting satellites / clouds */}
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
                  style={{ originX: "100px", originY: "100px" }}
                >
                  {/* Cloud 1 */}
                  <path d="M45 42 Q50 35 60 40 Q65 42 62 48 Q40 50 45 42 Z" fill="#FAF8F3" fillOpacity="0.75" />
                  {/* Cloud 2 */}
                  <path d="M130 145 Q138 138 148 143 Q152 148 147 155 Q120 155 130 145 Z" fill="#FAF8F3" fillOpacity="0.6" />
                </motion.g>
                
                {/* Forest canopy icons layered on Earth */}
                <circle cx="95" cy="85" r="4" fill="#FAF8F3" fillOpacity="0.2" />
                <circle cx="110" cy="95" r="5" fill="#FAF8F3" fillOpacity="0.2" />
              </svg>

              {/* Float overlays using absolute HTML overlay */}
              <div className="absolute top-[40%] right-[-10px] glass-panel px-3 py-1.5 rounded-xl border border-brand-forest/10 flex items-center gap-1.5 shadow-sm text-xxs font-bold text-brand-forest animate-float">
                <TrendingUp className="w-3.5 h-3.5 text-accent-leaf" />
                <span>+2.4kg CO₂ Saved</span>
              </div>
              <div className="absolute bottom-[20%] left-[-20px] glass-panel px-3 py-1.5 rounded-xl border border-brand-forest/10 flex items-center gap-1.5 shadow-sm text-xxs font-bold text-brand-forest animate-float" style={{ animationDelay: "1.5s" }}>
                <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>380 kcal Burned</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <section className="py-16">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold font-poppins text-brand-forest">
              Packed with Startup-Grade Features
            </h2>
            <p className="text-sm text-brand-brown/80 mt-2">
              Combining fitness tracker accuracy with gamification and localized AI to make sustainability addictively rewarding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col items-start text-left"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className={`p-3 rounded-xl mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-poppins text-brand-forest mb-2">{f.title}</h3>
                <p className="text-xs text-brand-brown/70 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-brand-forest/10 py-6 mt-auto flex flex-col items-center gap-2.5">
          <img src="/assets/MamaGreen-logo.png" alt="MamaGreen Logo" className="h-8 md:h-10 object-contain opacity-65" />
          <p className="text-xxs text-brand-brown/60">
            &copy; {new Date().getFullYear()} MamaGreen Inc. Build a greener earth, one step at a time.
          </p>
        </footer>

      </div>
    </div>
  );
}
