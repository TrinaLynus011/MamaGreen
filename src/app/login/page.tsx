"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  LogIn,
  User,
  MapPin,
  Footprints,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Compass,
  Leaf,
  RefreshCw,
  Award
} from "lucide-react";
import confetti from "canvas-confetti";
import { useUser } from "@/context/UserContext";
import { useUserStore } from "@/store/userStore";
import { API_BASE_URL } from "@/constants";

export default function LoginPage() {
  const router = useRouter();
  const { completeOnboarding } = useUser();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [signUpStep, setSignUpStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Onboarding Personalization
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState(21);
  const [locationInput, setLocationInput] = useState("");
  const [commutePreference, setCommutePreference] = useState("Bus");

  const token = useUserStore((state) => state.token);
  const profile = useUserStore((state) => state.userProfile);

  React.useEffect(() => {
    if (token && !profile.onboardingCompleted) {
      setIsSignUp(true);
      setSignUpStep(1);
      setFullName(profile.name || "");
      setAge(profile.age || 21);
      setLocationInput(profile.location || "");
      setCommutePreference(profile.commuteType || "Bus");
    }
  }, [token, profile.onboardingCompleted, profile.name, profile.age, profile.location, profile.commuteType]);

  // Autocomplete suggestions
  const INDIAN_CITIES = ["Chennai", "Coimbatore", "Madurai", "Trichy", "Bangalore", "Mumbai", "Delhi"];
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      alert("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      await useUserStore.getState().login(email, password);
      confetti({
        particleCount: 85,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#2E5E4E", "#8FAF8F", "#C6FF7E"]
      });
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGuest) {
      if (!email.trim() || !password.trim()) {
        alert("Please enter both email and password.");
        return;
      }
      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
    }
    if (!fullName.trim()) {
      alert("Please enter your Full Name.");
      return;
    }
    setSignUpStep(2);
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationInput.trim()) {
      alert("Please specify your primary location.");
      return;
    }

    setLoading(true);

    try {
      if (isGuest) {
        await completeOnboarding({
          fullName,
          age: Number(age),
          location: locationInput.trim(),
          commutePreference,
          email: `guest_${Date.now()}@mamagreen.com`,
        });
      } else {
        await useUserStore.getState().register({
          email,
          password,
          fullName,
          age: Number(age),
          location: locationInput.trim(),
          commutePreference,
        });
      }

      confetti({
        particleCount: 125,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#2E5E4E", "#8FAF8F", "#C6FF7E", "#A8E063"]
      });

      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startGuestOnboarding = () => {
    setIsGuest(true);
    setIsSignUp(true);
    setSignUpStep(1);
    setFullName("");
  };

  const cancelSignup = () => {
    setIsSignUp(false);
    setIsGuest(false);
    setSignUpStep(1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream relative px-6 py-8 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-sage/10 rounded-full blur-3xl -z-10 animate-pulse-slow" />

      <motion.div
        className="max-w-md w-full glass-card rounded-3xl p-8 relative shadow-xl border border-brand-sage/20 bg-white/40"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Logo System */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="mb-4 animate-float block">
            <img
              src="/assets/MamaGreen-logo.png"
              alt="MamaGreen Logo"
              className="h-24 md:h-28 object-contain transition-all"
            />
          </Link>
          <h2 className="text-xl font-extrabold font-poppins text-brand-forest">
            {isSignUp ? "Personalize Onboarding" : "Sign In to MamaGreen"}
          </h2>
          <p className="text-[11px] text-brand-brown/70 mt-1 max-w-[300px] leading-relaxed">
            {isSignUp
              ? `Step ${signUpStep} of 4: Setup your active Indian commuting profile.`
              : "Access your dashboard, log eco-commutes, and chat with Mama."}
          </p>
        </div>

        {/* -------------------- EMAIL LOGIN -------------------- */}
        {!isSignUp && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 mb-1 px-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-forest/60" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/70 border border-brand-sage/35 focus:border-brand-forest focus:outline-none rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-brand-brown placeholder-brand-brown/40 transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 mb-1 px-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-forest/60" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/70 border border-brand-sage/35 focus:border-brand-forest focus:outline-none rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-brand-brown placeholder-brand-brown/40 transition-all shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-forest hover:bg-brand-forest/90 disabled:bg-brand-forest/70 text-brand-cream font-bold font-poppins rounded-2xl shadow-md transition-all hover:-translate-y-0.5 text-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Signing In..." : "Sign In with Email"}
            </button>
          </form>
        )}

        {/* -------------------- 4-STEP SIGN UP / ONBOARDING -------------------- */}
        {isSignUp && (
          <div className="space-y-4">
            
            {/* STEP 1: IDENTITY */}
            {signUpStep === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 mb-1 px-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-forest/60" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Joan Trina"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/70 border border-brand-sage/35 focus:border-brand-forest focus:outline-none rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-brand-brown placeholder-brand-brown/40 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {!isGuest && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 mb-1 px-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-forest/60" />
                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white/70 border border-brand-sage/35 focus:border-brand-forest focus:outline-none rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-brand-brown placeholder-brand-brown/40 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 mb-1 px-1">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white/70 border border-brand-sage/35 focus:border-brand-forest focus:outline-none rounded-2xl py-3 px-4 text-xs font-semibold text-brand-brown placeholder-brand-brown/40 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 mb-1 px-1">
                          Confirm
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-white/70 border border-brand-sage/35 focus:border-brand-forest focus:outline-none rounded-2xl py-3 px-4 text-xs font-semibold text-brand-brown placeholder-brand-brown/40 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={cancelSignup}
                    className="flex-1 py-3 bg-white hover:bg-brand-forest/5 border border-brand-sage/20 text-brand-forest font-bold rounded-2xl transition-all text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-1 py-3 bg-brand-forest hover:bg-brand-forest/90 text-brand-cream font-bold rounded-2xl shadow-md transition-all text-xs cursor-pointer"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: AGE */}
            {signUpStep === 2 && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 px-1">
                      How old are you?
                    </label>
                    <span className="text-xs font-bold text-brand-forest">{age} years</span>
                  </div>
                  <div className="relative flex items-center">
                    <Footprints className="absolute left-4 w-4 h-4 text-brand-forest/60" />
                    <input
                      type="range"
                      min="12"
                      max="100"
                      step="1"
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value))}
                      className="w-full pl-11 accent-brand-forest cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setSignUpStep(1)}
                    className="flex-1 py-3 bg-white hover:bg-brand-forest/5 border border-brand-sage/20 text-brand-forest font-bold rounded-2xl transition-all text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setSignUpStep(3)}
                    className="flex-1 flex items-center justify-center gap-1 py-3 bg-brand-forest hover:bg-brand-forest/90 text-brand-cream font-bold rounded-2xl shadow-md transition-all text-xs cursor-pointer"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: LOCATION (AUTOCOMPLETE) */}
            {signUpStep === 3 && (
              <div className="space-y-4 relative">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 mb-1 px-1">
                    Primary Location (Search City)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-forest/60" />
                    <input
                      type="text"
                      required
                      placeholder="Type Chennai, Coimbatore, Delhi..."
                      value={locationInput}
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
                      className="w-full bg-white/70 border border-brand-sage/35 focus:border-brand-forest focus:outline-none rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-brand-brown placeholder-brand-brown/40 transition-all shadow-sm"
                    />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {citySuggestions.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-brand-sage/20 rounded-2xl shadow-lg max-h-40 overflow-y-auto">
                      {citySuggestions.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => selectCity(city)}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-brand-brown hover:bg-brand-forest/5 transition-all block border-b border-brand-forest/5 last:border-b-0"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setCitySuggestions([]);
                      setSignUpStep(2);
                    }}
                    className="flex-1 py-3 bg-white hover:bg-brand-forest/5 border border-brand-sage/20 text-brand-forest font-bold rounded-2xl transition-all text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (!locationInput.trim()) {
                        alert("Please type or select a location.");
                        return;
                      }
                      setCitySuggestions([]);
                      setSignUpStep(4);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-3 bg-brand-forest hover:bg-brand-forest/90 text-brand-cream font-bold rounded-2xl shadow-md transition-all text-xs cursor-pointer"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: COMMUTING PROFILE */}
            {signUpStep === 4 && (
              <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 mb-1 px-1">
                    What is your primary mode of commuting?
                  </label>
                  <div className="relative">
                    <Compass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-forest/60" />
                    <select
                      value={commutePreference}
                      onChange={(e) => setCommutePreference(e.target.value)}
                      className="w-full bg-white/70 border border-brand-sage/35 focus:border-brand-forest focus:outline-none rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-brand-brown transition-all shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="Walking">Walking</option>
                      <option value="Cycling">Cycling</option>
                      <option value="Bus">Bus</option>
                      <option value="Metro">Metro</option>
                      <option value="Train">Train</option>
                      <option value="Scooter">Scooter</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Car">Car</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSignUpStep(3)}
                    className="flex-1 py-3 bg-white hover:bg-brand-forest/5 border border-brand-sage/20 text-brand-forest font-bold rounded-2xl transition-all text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-brand-forest hover:bg-brand-forest/90 text-brand-cream font-bold rounded-2xl shadow-md transition-all text-xs cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 fill-brand-cream text-brand-cream" />
                    {loading ? "Configuring..." : "Start Journey"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Divider */}
        {!isSignUp && (
          <>
            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-brand-forest/10" />
              <span className="px-3 text-[9px] font-bold uppercase tracking-widest text-brand-brown/40">or</span>
              <div className="flex-1 border-t border-brand-forest/10" />
            </div>

            {/* Guest Login button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={startGuestOnboarding}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-sage/30 hover:bg-brand-sage/40 text-brand-forest font-bold font-poppins rounded-2xl shadow-sm hover:shadow-md transition-all text-xs cursor-pointer"
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-forest opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-forest"></span>
                </span>
                Instant Demo Guest Login
              </button>
            </div>
          </>
        )}

        {/* Toggle between Sign In / Sign Up */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setIsGuest(false);
              setSignUpStep(1);
            }}
            className="text-xxs font-bold text-brand-forest hover:underline cursor-pointer"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Info footer */}
        <div className="text-center mt-4 border-t border-brand-forest/5 pt-4">
          <span className="text-[9px] text-brand-brown/50 leading-relaxed block">
            Secure connection. Simulated database profiles run locally inside your sandbox.
          </span>
        </div>
      </motion.div>
    </div>
  );
}
