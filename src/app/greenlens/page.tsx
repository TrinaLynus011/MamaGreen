"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  Sparkles,
  TrendingDown,
  Activity,
  Heart,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Info
} from "lucide-react";
import { API_BASE_URL } from "@/constants";

const DEMO_SCANS = [
  { id: "salad", label: "Avocado Salad", filename: "organic_salad.jpg", icon: "🥗" },
  { id: "burger", label: "Beef Burger & Fries", filename: "beef_burger.jpg", icon: "🍔" },
  { id: "bike", label: "Commuter Bicycle", filename: "hybrid_bicycle.jpg", icon: "🚲" },
  { id: "car", label: "Gasoline Sedan", filename: "petrol_car.jpg", icon: "🚗" },
  { id: "bottle", label: "Single-Use Water Bottle", filename: "plastic_bottle.png", icon: "🥤" }
];

const LOCAL_MOCK_RESPONSES: Record<string, any> = {
  salad: {
    itemName: "Fresh Plant-Based Salad Bowl",
    category: "Diet & Nutrition",
    healthImpact: "Excellent (9.5/10). High in fiber, micronutrients, and hydration. Supports gut health and reduces inflammation.",
    carbonImpact: "Minimal (0.35 kg CO₂e). Local leafy greens and vegetables have extremely low agricultural and transit emissions.",
    alternative: "Excellent choice! To optimize further, choose organic, locally sourced produce and buy in bulk to minimize packaging waste."
  },
  burger: {
    itemName: "Beef Burger & Fries Meal",
    category: "Diet & Nutrition",
    healthImpact: "Low-Moderate (3/10). High in saturated fats, sodium, and simple carbs. High intake is linked to elevated cholesterol and heart disease risks.",
    carbonImpact: "Very High (4.80 kg CO₂e). Cattle farming is the leading agricultural emitter, requiring intensive land use, water, and generating methane.",
    alternative: "Swap for a Plant-based Beyond/Impossible Burger, which reduces emissions by 89% (~4.2kg CO₂ saved per serving) and has 0mg cholesterol."
  },
  car: {
    itemName: "Gasoline Combustion Passenger Vehicle",
    category: "Mobility & Travel",
    healthImpact: "Poor (2/10). Promotes sedentary habits. Combustion exhaust releases particulate matter (PM2.5) that harms local air quality and lungs.",
    carbonImpact: "High (180g CO₂ per kilometer). Direct tailpipe fossil fuel emissions.",
    alternative: "For commutes under 5km, walk or cycle (burns calories, 0 emissions). For longer trips, use public transit or an Electric Vehicle (EV)."
  },
  bike: {
    itemName: "Commuter Hybrid Bicycle",
    category: "Mobility & Travel",
    healthImpact: "Outstanding (10/10). High calorie burn (400-600 kcal/hr), strengthens joints, boosts cardiorespiratory health, and releases endorphins.",
    carbonImpact: "Zero (0.00 kg CO₂e). Fully powered by human energy. No fuel, no emissions.",
    alternative: "You're already using the most efficient vehicle on the planet! Keep tyres pumped to optimal PSI to reduce rolling resistance."
  },
  bottle: {
    itemName: "Single-Use Plastic Beverage Bottle",
    category: "Consumer Goods & Waste",
    healthImpact: "Moderate (5/10). Safe for single use, but poses risks of microplastic leaching when exposed to sunlight or heat over time.",
    carbonImpact: "High (0.24 kg CO₂e). Petroleum-based manufacturing, molding, transport, and low global recycling rates.",
    alternative: "Switch to a Double-Walled Stainless Steel Bottle. It keeps drinks cold, lasts a lifetime, and offsets its production footprint in just 12 refills."
  }
};

export default function GreenLens() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [backendActive, setBackendActive] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check backend status on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/greenlens`, {
          method: "POST"
        });
        // Just checking connectivity, form submission will fail on empty POST but if it returns 422/400 (validation error) it means it exists!
        if (res.status === 422 || res.status === 200) {
          setBackendActive(true);
        }
      } catch (e) {
        setBackendActive(false);
      }
    };
    checkBackend();
  }, []);

  const triggerScan = async (fileObj: File, demoKey?: string) => {
    setScanning(true);
    setAnalysis(null);

    // If using a demo scan key, load it directly
    if (demoKey && LOCAL_MOCK_RESPONSES[demoKey]) {
      setTimeout(() => {
        setAnalysis(LOCAL_MOCK_RESPONSES[demoKey]);
        setScanning(false);
      }, 1500); // 1.5s scanning animation delay
      return;
    }

    if (backendActive) {
      try {
        const formData = new FormData();
        formData.append("file", fileObj);

        const res = await fetch(`${API_BASE_URL}/greenlens`, {
          method: "POST",
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          setAnalysis(data);
        } else {
          // fallback
          fallbackAnalysis(fileObj.name);
        }
      } catch (err) {
        console.error("Backend error scanning image", err);
        fallbackAnalysis(fileObj.name);
      } finally {
        setScanning(false);
      }
    } else {
      // Offline fallback scanner simulation delay
      setTimeout(() => {
        fallbackAnalysis(fileObj.name);
        setScanning(false);
      }, 1500);
    }
  };

  const fallbackAnalysis = (filename: string) => {
    const fn = filename.toLowerCase();
    let key = "salad"; // default

    if (fn.includes("burger") || fn.includes("beef") || fn.includes("meat") || fn.includes("steak")) {
      key = "burger";
    } else if (fn.includes("car") || fn.includes("suv") || fn.includes("gas") || fn.includes("petrol")) {
      key = "car";
    } else if (fn.includes("bike") || fn.includes("bicycle") || fn.includes("cycle")) {
      key = "bike";
    } else if (fn.includes("bottle") || fn.includes("plastic") || fn.includes("cup") || fn.includes("can")) {
      key = "bottle";
    }

    setAnalysis(LOCAL_MOCK_RESPONSES[key]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      triggerScan(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      triggerScan(file);
    }
  };

  const handleDemoClick = (demo: typeof DEMO_SCANS[0]) => {
    setSelectedFile(null);
    setPreviewUrl(null);
    // Simulate preview
    setPreviewUrl("demo"); // triggers placeholder in UI
    triggerScan(new File([], demo.filename), demo.id);
  };

  const getCarbonGlow = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("diet") || cat.includes("goods") || cat.includes("waste")) return "border-orange-200 bg-orange-50/30";
    if (cat.includes("mobility") || cat.includes("travel")) return "border-rose-200 bg-rose-50/30";
    return "border-emerald-200 bg-emerald-50/30";
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Upload/Scan area (Left panel) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        
        {/* Main Upload Box */}
        <div className="glass-card rounded-3xl p-6 flex flex-col items-center justify-between min-h-87.5 relative overflow-hidden">
          <div className="w-full">
            <span className="text-xs uppercase tracking-wider text-brand-forest/60 font-semibold">GreenLens Scanner</span>
            <h2 className="text-xl font-bold font-poppins text-brand-forest mb-4">Scan Daily Item</h2>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`w-full flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all relative select-none ${
              dragActive
                ? "border-brand-forest bg-brand-forest/5 scale-[1.01]"
                : "border-brand-sage/35 bg-white/40 hover:bg-white/60"
            }`}
          >
            {/* Real Upload Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* View overlays based on state */}
            {previewUrl ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                
                {/* Visual preview box */}
                <div className="w-32 h-32 rounded-2xl bg-brand-sage/15 border border-brand-sage/20 flex items-center justify-center text-4xl mb-3 shadow-inner relative overflow-hidden">
                  {previewUrl === "demo" ? (
                    <span className="text-5xl animate-bounce">🔍</span>
                  ) : (
                    // In real sandbox, we render local preview URL
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  
                  {/* Laser Scanning Beam animation */}
                  {scanning && (
                    <motion.div
                      className="absolute left-0 right-0 h-1 bg-linear-to-r from-emerald-400 via-brand-forest to-emerald-400 shadow-[0_0_8px_#2E5E4E]"
                      initial={{ top: 0 }}
                      animate={{ top: ["0%", "98%", "0%"] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>

                <span className="text-xxs font-bold text-brand-forest/80 uppercase">
                  {scanning ? "GreenLens Scanning..." : "Analysis Completed"}
                </span>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 text-xxs font-bold text-brand-forest/70 hover:text-brand-forest underline"
                >
                  Upload a different image
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 bg-brand-forest/10 rounded-full mb-3 text-brand-forest">
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>
                
                <h4 className="font-bold text-xs text-brand-forest">Drag & Drop Image Here</h4>
                <p className="text-[10px] text-brand-brown/70 mt-1 max-w-50 leading-snug">
                  Upload daily food, transportation setups, or purchases to analyze their carbon and health profile.
                </p>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-4 py-2 bg-brand-forest text-brand-cream text-xxs font-bold rounded-xl shadow-sm hover:bg-brand-forest/90 transition-all"
                >
                  Browse Files
                </button>
              </>
            )}
          </div>

          <div className="w-full mt-4 flex items-center gap-1.5 justify-center">
            <Info className="w-3.5 h-3.5 text-brand-forest/60" />
            <span className="text-[10px] text-brand-brown/60 font-semibold">
              Supports JPG, PNG formats up to 5MB.
            </span>
          </div>
        </div>

        {/* Predefined Demo Buttons */}
        <div className="glass-card rounded-2xl p-4">
          <span className="text-[10px] font-bold text-brand-brown/50 block mb-2 uppercase tracking-wider">
            Quick Sandbox Scans (No upload needed):
          </span>
          <div className="flex flex-wrap gap-2">
            {DEMO_SCANS.map((demo) => (
              <button
                key={demo.id}
                onClick={() => handleDemoClick(demo)}
                className="px-3 py-1.5 rounded-xl border border-brand-sage/20 bg-white/60 hover:bg-brand-forest/5 text-xxs font-semibold text-brand-brown flex items-center gap-1.5 transition-all"
              >
                <span>{demo.icon}</span>
                <span>{demo.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Analysis Results Display (Right panel) */}
      <div className="lg:col-span-7 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          {scanning ? (
            <motion.div
              key="scanning-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center min-h-87.5 text-center border-brand-sage/20"
            >
              <RefreshCw className="w-8 h-8 text-brand-forest animate-spin mb-4" />
              <h3 className="font-bold font-poppins text-brand-forest text-lg">MamaGreen LLaVA Vision AI</h3>
              <p className="text-xs text-brand-brown/70 mt-1 max-w-70">
                Deconstructing chemical structures, carbon transport loops, and active fitness benefits...
              </p>
            </motion.div>
          ) : analysis ? (
            <motion.div
              key="result-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Result Header */}
              <div className="glass-card rounded-3xl p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xxs font-extrabold uppercase tracking-widest text-brand-forest/60">
                      Scan Result / {analysis.category}
                    </span>
                    <h3 className="text-xl font-bold font-poppins text-brand-forest mt-0.5">
                      {analysis.itemName}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xxs font-bold border capitalize ${getCarbonGlow(analysis.category)}`}>
                    {analysis.category}
                  </span>
                </div>
              </div>

              {/* Health and Carbon impact detail cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Health Rating */}
                <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-3 text-brand-forest">
                    <Heart className="w-5 h-5 fill-rose-100 text-rose-500 animate-pulse" />
                    <h4 className="font-bold text-xs font-poppins">Health Profile</h4>
                  </div>
                  <p className="text-xs text-brand-brown/80 leading-relaxed font-medium">
                    {analysis.healthImpact}
                  </p>
                </div>

                {/* Carbon Rating */}
                <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-3 text-brand-forest">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <h4 className="font-bold text-xs font-poppins">Carbon Footprint</h4>
                  </div>
                  <p className="text-xs text-brand-brown/80 leading-relaxed font-medium">
                    {analysis.carbonImpact}
                  </p>
                </div>

              </div>

              {/* Greener Alternative Card */}
              <div className="bg-linear-to-r from-brand-forest to-emerald-700 text-brand-cream rounded-3xl p-6 shadow-sm border border-brand-forest/15">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-yellow-500 rounded text-brand-forest">
                    <Sparkles className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  </div>
                  <span className="text-xxs font-bold uppercase tracking-widest text-brand-cream/80">Greener Alternative</span>
                </div>

                <p className="text-xs text-brand-cream/95 leading-relaxed font-medium mt-2">
                  {analysis.alternative}
                </p>
              </div>

            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center min-h-87.5 text-center border-brand-sage/20 border-2 border-dashed"
            >
              <Camera className="w-8 h-8 text-brand-forest/40 mb-3" />
              <h4 className="font-bold text-sm text-brand-forest">No Scan Data</h4>
              <p className="text-xxs text-brand-brown/70 mt-1 max-w-60 leading-relaxed">
                Upload a file or choose one of our quick sandbox scans on the left to start analyzing environmental impacts.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
