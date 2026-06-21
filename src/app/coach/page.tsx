"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Leaf,
  Sparkles,
  TrendingDown,
  ChevronRight,
  User,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { API_BASE_URL } from "@/constants";

const QUICK_PROMPTS = [
  "How can I reduce my footprint tomorrow?",
  "How does Sprout evolve?",
  "What is a plant-based food swap?",
  "Give me a green commuting tip."
];

// High-fidelity fallback chat simulator logic in case FastAPI backend is offline
const MOCK_AI_ANSWERS: Record<string, string> = {
  "hello": `Hello! I am **Mama**, your AI lifestyle coach. 🌿 I am here to help you optimize your daily life.

- **Carbon Impact:** Swap solo rides to reduce emissions.
- **Savings Impact:** Save ₹150+ daily by choosing bus/metro.
- **Health Impact:** Walking adds steps to boost your EcoHealth score.
- **Reduction Recommendation:** Let's plan tomorrow's green commute!`,
  "tomorrow": `Here is your proactive **MamaGreen Plan** for tomorrow:

- **Carbon Impact:** Swapping a cab for public transit reduces carbon emissions by **0.8kg CO₂**.
- **Savings Impact:** Save **₹65** by using bus or metro instead of a taxi.
- **Health Impact:** Walking to the station adds **1,500+ steps** and burns **60 kcal**.
- **Reduction Recommendation:** Ditch solo rides tomorrow. Log a metro or bus ride on your dashboard!`,
  "reduce": `To systematically reduce emissions, follow this guidance:

- **Carbon Impact:** Public transit cuts travel footprint by **80%** compared to driving a solo car.
- **Savings Impact:** Swapping cabs for shared transit keeps **₹3,000+ per month** in your pocket.
- **Health Impact:** Active transit adds daily steps, boosting cardiovascular fitness.
- **Reduction Recommendation:** Walk or cycle for errands under 2km. Use Metro for longer journeys.`,
  "pet": `Here is the impact of your actions on Sprout:

- **Carbon Impact:** Low carbon logs feed Sprout's energy (+15% for walking).
- **Savings Impact:** Saving money allows purchasing premium items for Sprout.
- **Health Impact:** Active logs boost Sprout's level and unlock evolution tiers.
- **Reduction Recommendation:** Maintain a 7-day walking streak to evolve Sprout into a *Guardian Tree*!`,
  "route": `Here is the route optimizer advice:

- **Carbon Impact:** Walking has **0g CO₂/km** emissions, Metro is **12g**, and Cars emit **180g**.
- **Savings Impact:** Walking is free, Metro is ₹20-40, and Cabs are ₹150+.
- **Health Impact:** Cycling burns **250 kcal/hour** and walking burns **180 kcal/hour**.
- **Reduction Recommendation:** Use the Route Planner screen to find and compare green routes!`,
  "diet": `Here is the diet sustainability advice:

- **Carbon Impact:** Swap mutton/poultry for lentils to cut dietary emissions by **75%**.
- **Savings Impact:** Vegetarian grocery shopping saves up to **₹800/week** compared to buying meat.
- **Health Impact:** Beans and millets (*Ragi*/*Jowar*) provide fiber and clean energy.
- **Reduction Recommendation:** Swap one meat meal for a traditional *dal-roti-sabzi* lunch today!`,
  "general": `Here is your general sustainability assessment:

- **Carbon Impact:** Commuting by metro instead of taxi cuts travel footprint by **85%**.
- **Savings Impact:** Commuting by public transit saves ₹50-100 per trip.
- **Health Impact:** Walking to the bus stop adds 1,500 steps.
- **Reduction Recommendation:** Log a short walk to your nearby market today to keep your daily streak alive!`
};

export default function AICoach() {
  const { profile, backendActive } = useUser();
  const commute = profile.commutePreference.toLowerCase();
  const city = profile.primaryLocation;

  // Personalized quick prompts based on commute
  const QUICK_PROMPTS = commute === "walking" || commute === "cycling"
    ? [
      `How can I walk more efficiently in ${city}?`,
      "What are the health benefits of cycling daily?",
      "How does Sprout evolve?",
      "Give me a plant-based meal tip for India."
    ]
    : commute === "bus" || commute === "metro" || commute === "train"
    ? [
      `What are the best transit routes in ${city}?`,
      "How much CO₂ does the Metro save vs a car?",
      "How does Sprout evolve?",
      `Give me a green commuting tip for ${city}.`
    ]
    : [
      "How can I reduce my car footprint?",
      `Are there transit alternatives in ${city}?`,
      "How does Sprout evolve?",
      "What is a plant-based food swap?"
    ];

  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      sender: "mama",
      text: `Hello, **${profile.username}**! I'm **Mama**, your personal AI Eco Coach. 🌿\n\nI can see you're based in **${city}** and primarily travel by **${profile.commutePreference}**. I'll tailor all my suggestions specifically for you.\n\nHow can I help you reduce your environmental footprint today?`,
      time: "Just now"
    }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Update initial greeting when profile changes
  useEffect(() => {
    setMessages([
      {
        id: 1,
        sender: "mama",
        text: `Hello, **${profile.username}**! I'm **Mama**, your personal AI Eco Coach. 🌿\n\nI can see you're based in **${city}** and primarily travel by **${profile.commutePreference}**. I'll tailor all my suggestions specifically for you.\n\nHow can I help you reduce your environmental footprint today?`,
        time: "Just now"
      }
    ]);
  }, [profile.username, profile.primaryLocation, profile.commutePreference]);

  // Scroll to bottom whenever messages list grows
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    if (backendActive) {
      try {
        const res = await fetch(`${API_BASE_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: textToSend })
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            sender: "mama",
            text: data.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      } catch (err) {
        console.error("Error connecting to FastAPI chatbot", err);
        generateMockResponse(textToSend);
      } finally {
        setTyping(false);
      }
    } else {
      // Offline fallback simulator delay
      setTimeout(() => {
        generateMockResponse(textToSend);
        setTyping(false);
      }, 1000);
    }
  };

  const generateMockResponse = (prompt: string) => {
    const p = prompt.toLowerCase();
    let reply = MOCK_AI_ANSWERS.general;

    if (p.includes("hello") || p.includes("hi ") || p.includes("hey")) {
      reply = MOCK_AI_ANSWERS.hello;
    } else if (p.includes("tomorrow") || p.includes("plan") || p.includes("schedule")) {
      reply = MOCK_AI_ANSWERS.tomorrow;
    } else if (p.includes("reduce") || p.includes("carbon") || p.includes("footprint") || p.includes("emissions")) {
      reply = MOCK_AI_ANSWERS.reduce;
    } else if (p.includes("sprout") || p.includes("evolve") || p.includes("pet")) {
      reply = MOCK_AI_ANSWERS.pet;
    } else if (p.includes("diet") || p.includes("eat") || p.includes("food") || p.includes("swap")) {
      reply = MOCK_AI_ANSWERS.diet;
    } else if (p.includes("commute") || p.includes("route") || p.includes("transit") || p.includes("trip")) {
      reply = MOCK_AI_ANSWERS.route;
    }

    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      sender: "mama",
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  // Helper to convert basic markdown back into HTML strings
  const renderMessageText = (txt: string) => {
    return txt
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-6 flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] gap-4">
      
      {/* Chat Header */}
      <div className="glass-card rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-forest/15 rounded-xl border border-brand-forest/15 animate-float text-brand-forest">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold font-poppins text-brand-forest text-sm">Mama</h3>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="text-[10px] text-brand-brown/60 font-semibold">AI Eco Coach & Plan Advisor</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
            backendActive 
              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
              : "bg-amber-100 text-amber-800 border-amber-300"
          }`}>
            {backendActive ? "Ollama Llama3" : "Local AI Engine"}
          </span>
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 glass-card rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative">
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMama = msg.sender === "mama";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${isMama ? "justify-start" : "justify-end"} items-end gap-2`}
                >
                  {isMama && (
                    <div className="w-7 h-7 rounded-xl bg-brand-sage/20 border border-brand-sage flex items-center justify-center font-bold text-xs text-brand-forest flex-shrink-0">
                      M
                    </div>
                  )}
                  
                  <div className="max-w-[80%] flex flex-col">
                    <div
                      className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                        isMama
                          ? "bg-white border border-brand-sage/20 text-brand-brown rounded-bl-sm"
                          : "bg-brand-forest text-brand-cream rounded-br-sm shadow-sm"
                      }`}
                      dangerouslySetInnerHTML={{ __html: renderMessageText(msg.text) }}
                    />
                    <span className="text-[9px] text-brand-brown/40 font-semibold mt-1 px-1 align-self-end">
                      {msg.time}
                    </span>
                  </div>

                  {!isMama && (
                    <div className="w-7 h-7 rounded-xl bg-brand-forest text-brand-cream flex items-center justify-center font-bold text-xs flex-shrink-0">
                      U
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Typing Indicator */}
            {typing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start items-center gap-2"
              >
                <div className="w-7 h-7 rounded-xl bg-brand-sage/20 border border-brand-sage flex items-center justify-center font-bold text-xs text-brand-forest flex-shrink-0">
                  M
                </div>
                <div className="bg-white border border-brand-sage/20 px-4 py-3 rounded-2xl flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-brand-forest rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-brand-forest rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-brand-forest rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mt-4 pt-4 border-t border-brand-forest/5 flex flex-wrap gap-2 items-center">
          <HelpCircle className="w-4 h-4 text-brand-forest/60" />
          <span className="text-xxs font-bold text-brand-brown/50 mr-1 uppercase">Quick Prompts:</span>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-[10px] font-bold text-brand-forest bg-brand-forest/5 hover:bg-brand-forest/10 border border-brand-forest/10 rounded-full px-3 py-1 transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask Mama how to reduce your footprint tomorrow..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-white/70 border border-brand-sage/20 focus:border-brand-forest focus:outline-none rounded-2xl py-3 px-5 text-xs font-semibold text-brand-brown shadow-sm transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || typing}
          className="px-5 bg-brand-forest hover:bg-brand-forest/90 disabled:bg-brand-forest/50 text-brand-cream font-bold rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-center"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>

    </div>
  );
}
