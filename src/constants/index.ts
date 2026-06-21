// ─────────────────────────────────────────────────────────────────────────────
// MamaGreen — Application Constants
// Central registry for all magic numbers and configuration values
// ─────────────────────────────────────────────────────────────────────────────

import type { TransportMode, EcoHealthLevel } from "@/types";

// ── API ───────────────────────────────────────────────────────────────────────
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

// ── Indian Cities ─────────────────────────────────────────────────────────────
export const INDIAN_CITIES: string[] = [
  "Bengaluru",
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Trichy",
  "Mumbai",
  "Pune",
  "Delhi",
  "Hyderabad",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Kochi",
  "Chandigarh",
  "Surat",
];

// ── Transport Modes ───────────────────────────────────────────────────────────
export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  walking: "Walking",
  bicycle: "Cycling",
  metro: "Metro",
  bus: "Bus",
  train: "Train",
  auto: "Auto",
  scooter: "Scooter",
  car: "Car",
};

export const COMMUTE_OPTIONS: string[] = [
  "Walking",
  "Cycling",
  "Bus",
  "Metro",
  "Train",
  "Auto",
  "Scooter",
  "Car",
  "Mixed",
];

// ── Emissions Factors (kg CO2 per km) ─────────────────────────────────────────
// Source: IPCC & Indian transport emission factors
export const EMISSIONS_FACTORS: Record<TransportMode, number> = {
  walking: 0.0,
  bicycle: 0.0,
  metro: 0.015, // Electric metro — very low
  bus: 0.040,   // BMTC/BEST/government bus
  train: 0.012, // Indian Railways — grid-mix electric
  auto: 0.080,  // CNG auto-rickshaw
  scooter: 0.055, // Petrol scooter (2-stroke avg)
  car: 0.185,   // Petrol sedan — India avg
};

// Reference car emission factor for "vs car" savings calculation
export const CAR_EMISSION_FACTOR: number = EMISSIONS_FACTORS.car;

// ── Calorie Factors (kcal per km) ─────────────────────────────────────────────
export const CALORIES_FACTORS: Record<TransportMode, number> = {
  walking: 60.0,
  bicycle: 40.0,
  metro: 0.0,
  bus: 0.0,
  train: 0.0,
  auto: 0.0,
  scooter: 0.0,
  car: 0.0,
};

// ── Cost Factors (₹ INR) ──────────────────────────────────────────────────────
// Flat fares and per-km rates for Indian transport
export const COST_FLAT: Record<TransportMode, number> = {
  walking: 0,
  bicycle: 0,
  metro: 30, // Base metro fare
  bus: 15,   // Typical city bus fare
  train: 20, // Local suburban
  auto: 25,  // Base auto meter
  scooter: 0,
  car: 0,
};

export const COST_PER_KM: Record<TransportMode, number> = {
  walking: 0,
  bicycle: 0,
  metro: 2,   // Per km above base
  bus: 1,     // Per km above base
  train: 1.5,
  auto: 15,   // ₹15/km (auto meter)
  scooter: 4, // Fuel cost approx
  car: 12,    // Fuel + depreciation approx
};

// ── Speed (km/h average in Indian city) ───────────────────────────────────────
export const SPEED_KMH: Record<TransportMode, number> = {
  walking: 4.5,
  bicycle: 14,
  metro: 35,
  bus: 18,
  train: 40,
  auto: 22,
  scooter: 28,
  car: 25,
};

// ── EcoHealth Score Thresholds ────────────────────────────────────────────────
export const ECO_HEALTH_THRESHOLDS: Array<{ min: number; level: EcoHealthLevel }> = [
  { min: 90, level: "Transit Champion" },
  { min: 75, level: "Carbon Saver" },
  { min: 60, level: "Sustainable Traveler" },
  { min: 40, level: "Green Explorer" },
  { min: 20, level: "Smart Commuter" },
  { min: 0, level: "Eco Starter" },
];

// ── Map ────────────────────────────────────────────────────────────────────────
export const INDIA_CENTER: [number, number] = [78.9629, 20.5937];

// ── Challenge XP Rewards ──────────────────────────────────────────────────────
export const XP_PER_LEVEL = 200; // XP required to advance each level

// ── Leaderboard Fallback ───────────────────────────────────────────────────────
export const FALLBACK_LEADERBOARD = [
  { rank: 1, username: "Priya Sharma", xp: 750, isUser: false },
  { rank: 2, username: "Rahul Verma", xp: 680, isUser: false },
  { rank: 3, username: "You", xp: 480, isUser: true },
  { rank: 4, username: "Amit Patel", xp: 420, isUser: false },
  { rank: 5, username: "Rohan Das", xp: 310, isUser: false },
];

// ── Eco Story — Tree equivalence ──────────────────────────────────────────────
// 1 tree absorbs ~21 kg CO2/year → ~1.75 kg/month
export const CO2_PER_TREE_PER_MONTH_KG = 1.75;
