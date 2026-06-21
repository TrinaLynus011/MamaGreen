// ─────────────────────────────────────────────────────────────────────────────
// MamaGreen — Carbon & Health Calculators
// Pure functions — no side effects, fully unit-testable
// ─────────────────────────────────────────────────────────────────────────────

import {
  EMISSIONS_FACTORS,
  CAR_EMISSION_FACTOR,
  CALORIES_FACTORS,
  COST_FLAT,
  COST_PER_KM,
  SPEED_KMH,
  ECO_HEALTH_THRESHOLDS,
  XP_PER_LEVEL,
  CO2_PER_TREE_PER_MONTH_KG,
} from "@/constants";
import type { TransportMode, EcoHealthLevel } from "@/types";

/**
 * Calculate CO2 emissions for a trip in kg
 */
export function calculateEmissions(mode: TransportMode, distanceKm: number): number {
  const factor = EMISSIONS_FACTORS[mode] ?? 0;
  return Math.round(factor * distanceKm * 1000) / 1000;
}

/**
 * Calculate CO2 saved vs. equivalent car trip in kg
 */
export function calculateCarbonSaved(mode: TransportMode, distanceKm: number): number {
  const carEmissions = CAR_EMISSION_FACTOR * distanceKm;
  const actualEmissions = calculateEmissions(mode, distanceKm);
  return Math.max(0, Math.round((carEmissions - actualEmissions) * 1000) / 1000);
}

/**
 * Calculate calories burned for a trip in kcal
 */
export function calculateCalories(mode: TransportMode, distanceKm: number): number {
  const factor = CALORIES_FACTORS[mode] ?? 0;
  return Math.round(factor * distanceKm);
}

/**
 * Calculate trip cost in ₹ INR
 */
export function calculateCost(mode: TransportMode, distanceKm: number): number {
  const flat = COST_FLAT[mode] ?? 0;
  const perKm = COST_PER_KM[mode] ?? 0;
  return Math.round(flat + perKm * distanceKm);
}

/**
 * Calculate money saved vs. equivalent car trip in ₹
 */
export function calculateMoneySaved(mode: TransportMode, distanceKm: number): number {
  const carCost = calculateCost("car", distanceKm);
  const actualCost = calculateCost(mode, distanceKm);
  return Math.max(0, carCost - actualCost);
}

/**
 * Estimate trip duration in minutes
 */
export function estimateDuration(mode: TransportMode, distanceKm: number): number {
  const speed = SPEED_KMH[mode] ?? 20;
  return Math.round((distanceKm / speed) * 60);
}

/**
 * Derive EcoHealth level label from numeric score
 */
export function scoreToEcoHealthLevel(score: number): EcoHealthLevel {
  for (const { min, level } of ECO_HEALTH_THRESHOLDS) {
    if (score >= min) return level;
  }
  return "Seed";
}

/**
 * Calculate user level and remaining XP from total XP
 * Each level requires (level × XP_PER_LEVEL) XP to advance
 */
export function calculateLevelFromXp(totalXp: number): { level: number; remainingXp: number; xpToNext: number } {
  let level = 1;
  let remaining = totalXp;
  let required = XP_PER_LEVEL;

  while (remaining >= required) {
    remaining -= required;
    level += 1;
    required = level * XP_PER_LEVEL;
  }

  return { level, remainingXp: remaining, xpToNext: required };
}

/**
 * Calculate how many virtual trees are equivalent to CO2 saved
 */
export function co2ToTrees(co2Kg: number): number {
  return Math.floor(co2Kg / CO2_PER_TREE_PER_MONTH_KG);
}

/**
 * Determine which transport mode has lowest carbon for a given distance
 */
export function getLowestCarbonMode(
  modes: TransportMode[],
  distanceKm: number
): TransportMode {
  return modes.reduce((best, mode) =>
    calculateEmissions(mode, distanceKm) < calculateEmissions(best, distanceKm)
      ? mode
      : best
  );
}

/**
 * Generate a personalised "recommended action" based on current user stats
 */
export function getRecommendedAction(stats: {
  carbonToday: number;
  stepsToday: number;
  ecohealthScore: number;
  commutePreference: string;
}): { action: string; impact: string; icon: "walk" | "transit" | "score" | "challenge" } {
  const { carbonToday, stepsToday, ecohealthScore, commutePreference } = stats;

  if (carbonToday > 2.0) {
    return {
      action: "Take the Metro or Bus for your next commute",
      impact: `You've emitted ${carbonToday.toFixed(1)} kg CO₂ today — switching saves up to ${calculateCarbonSaved("metro", 10).toFixed(1)} kg`,
      icon: "transit",
    };
  }

  if (stepsToday < 3000) {
    return {
      action: "Walk to your next destination under 2 km",
      impact: "Burns ~120 kcal and saves ₹25–50 in auto fares",
      icon: "walk",
    };
  }

  if (ecohealthScore < 60) {
    return {
      action: "Log a green commute to boost your EcoHealth Score",
      impact: "Walking 2.5 km adds +4 EcoHealth points",
      icon: "score",
    };
  }

  const isPrimarilyActive =
    commutePreference.toLowerCase() === "walking" ||
    commutePreference.toLowerCase() === "cycling";

  if (isPrimarilyActive) {
    return {
      action: "Complete today's walking challenge",
      impact: "You're close to your daily step goal — 800 more steps to go!",
      icon: "challenge",
    };
  }

  return {
    action: "Try the Route Planner for your next trip",
    impact: "Compare carbon, cost, and time for every commute option",
    icon: "transit",
  };
}
