// ─────────────────────────────────────────────────────────────────────────────
// MamaGreen — Shared TypeScript interfaces
// Single source of truth for all data shapes across frontend
// ─────────────────────────────────────────────────────────────────────────────

export interface SproutData {
  name: string;
  level: number;
  mood: string;
  evolutionStage: string;
  xp: number;
  energy: number;
  xpNextLevel: number;
}

export interface UserProfile {
  id: number;
  username: string;
  age: number;
  primaryLocation: string;
  commutePreference: string;
  avatarType: string;
  profileCompletion: number;
  xp: number;
  level: number;
  streak: number;
  ecohealthScore: number;
  ecoHealthLevel: EcoHealthLevel;
  carbonSaved: number;
  carbonToday: number;
  moneySaved: number;
  stepsToday: number;
  caloriesToday: number;
  createdAt: string;
  updatedAt: string;
  sprout: SproutData;
}

export type EcoHealthLevel =
  | "Seed"
  | "Sapling"
  | "Young Tree"
  | "Forest Guardian"
  | "Earth Protector"
  | "Eco Starter"
  | "Smart Commuter"
  | "Green Explorer"
  | "Sustainable Traveler"
  | "Carbon Saver"
  | "Transit Champion";

export type TransportMode =
  | "walking"
  | "bicycle"
  | "metro"
  | "bus"
  | "train"
  | "auto"
  | "scooter"
  | "car";

export interface MobilityLog {
  id: number;
  date: string;
  mode: TransportMode;
  distance: number; // km
  duration: number; // minutes
  emissions: number; // kg CO2
  calories: number; // kcal
  cost: number; // ₹ INR
}

export interface LogTripInput {
  mode: TransportMode;
  distance: number;
  duration: number;
}

export type ChallengeType = "daily" | "weekly" | "monthly";

export interface Challenge {
  id: number;
  title: string;
  description: string;
  type: ChallengeType;
  goalValue: number;
  currentValue: number;
  rewardXp: number;
  rewardScore: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  xp: number;
  isUser: boolean;
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  tip: string;
}

export interface RouteOption {
  mode: TransportMode;
  label: string;
  time: number; // minutes
  distance: number; // km
  cost: number; // ₹
  emissions: number; // kg CO2
  calories: number; // kcal
  isRecommended: boolean;
  carVsSavings?: {
    timeSaved: number;
    moneySaved: number;
    co2Saved: number;
  };
}

export interface AnalyticsData {
  emissionsTrend: Array<{ day: string; actual: number; saved: number }>;
  fitnessTrend: Array<{ day: string; distance: number; calories: number }>;
  costSavings: Array<{ day: string; amount: number }>;
  modeSplit: Array<{ name: string; value: number; color: string }>;
  totalCarbon: number;
  totalSaved: number;
  totalMoney: number;
  totalSteps: number;
  totalCalories: number;
  totalDistance: number;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";
