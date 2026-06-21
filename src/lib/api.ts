// ─────────────────────────────────────────────────────────────────────────────
// MamaGreen — Typed API Client
// Centralised fetch wrapper with error handling and typed responses
// All network calls go through this module — no raw fetch() in components
// ─────────────────────────────────────────────────────────────────────────────

import { API_BASE_URL } from "@/constants";
import type {
  UserProfile,
  MobilityLog,
  Challenge,
  LeaderboardEntry,
  WeatherData,
  AnalyticsData,
  LogTripInput,
} from "@/types";

// ── Generic fetch wrapper ────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── User ─────────────────────────────────────────────────────────────────────

interface RawProfile {
  username: string;
  age: number;
  primary_location: string;
  commute_preference: string;
  avatar_type: string;
  profile_completion: number;
  xp: number;
  level: number;
  streak: number;
  ecohealth_score: number;
  carbon_saved: number;
  carbon_today: number;
  money_saved: number;
  steps_today: number;
  calories_today: number;
  created_at: string;
  updated_at: string;
  sprout: {
    name: string;
    level: number;
    mood: string;
    evolution_stage: string;
    xp: number;
    energy: number;
  };
}

function mapProfile(raw: RawProfile): UserProfile {
  return {
    id: 1,
    username: raw.username,
    age: raw.age,
    primaryLocation: raw.primary_location,
    commutePreference: raw.commute_preference,
    avatarType: raw.avatar_type,
    profileCompletion: raw.profile_completion,
    xp: raw.xp,
    level: raw.level,
    streak: raw.streak,
    ecohealthScore: raw.ecohealth_score,
    ecoHealthLevel: "Sapling", // will be overridden by context
    carbonSaved: raw.carbon_saved,
    carbonToday: raw.carbon_today,
    moneySaved: raw.money_saved ?? 0,
    stepsToday: raw.steps_today,
    caloriesToday: raw.calories_today,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    sprout: {
      name: raw.sprout?.name ?? "Sprout",
      level: raw.sprout?.level ?? 1,
      mood: raw.sprout?.mood ?? "Happy",
      evolutionStage: raw.sprout?.evolution_stage ?? "Seed",
      xp: raw.sprout?.xp ?? 0,
      energy: raw.sprout?.energy ?? 100,
      xpNextLevel: (raw.sprout?.level ?? 1) * 100,
    },
  };
}

export async function fetchProfile(): Promise<UserProfile> {
  const raw = await apiFetch<RawProfile>("/user/profile");
  return mapProfile(raw);
}

export async function updateProfileApi(changes: Partial<{
  username: string;
  age: number;
  primaryLocation: string;
  commutePreference: string;
}>): Promise<UserProfile> {
  const payload = {
    username: changes.username,
    age: changes.age,
    location: changes.primaryLocation,
    commutePreference: changes.commutePreference,
  };
  const raw = await apiFetch<RawProfile>("/user/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapProfile(raw);
}

// ── Trips / Mobility Logs ────────────────────────────────────────────────────

interface RawLog {
  id: number;
  date: string;
  mode: string;
  distance: number;
  duration: number;
  emissions: number;
  calories: number;
  cost: number;
}

function mapLog(raw: RawLog): MobilityLog {
  return {
    id: raw.id,
    date: raw.date,
    mode: raw.mode as MobilityLog["mode"],
    distance: raw.distance,
    duration: raw.duration,
    emissions: raw.emissions,
    calories: raw.calories,
    cost: raw.cost,
  };
}

export async function fetchHistory(): Promise<MobilityLog[]> {
  const raw = await apiFetch<RawLog[]>("/history");
  return raw.map(mapLog);
}

export async function logTrip(input: LogTripInput): Promise<{ success: boolean }> {
  return apiFetch("/log-trip", {
    method: "POST",
    body: JSON.stringify({
      mode: input.mode,
      distance: input.distance,
      duration: input.duration,
    }),
  });
}

// ── Challenges ────────────────────────────────────────────────────────────────

interface RawChallenge {
  id: number;
  title: string;
  description: string;
  type: string;
  goal_value: number;
  current_value: number;
  reward_xp: number;
  reward_score: number;
  is_completed: boolean;
  is_claimed: boolean;
}

function mapChallenge(raw: RawChallenge): Challenge {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    type: raw.type as Challenge["type"],
    goalValue: raw.goal_value,
    currentValue: raw.current_value,
    rewardXp: raw.reward_xp,
    rewardScore: raw.reward_score,
    isCompleted: raw.is_completed,
    isClaimed: raw.is_claimed,
  };
}

export async function fetchChallenges(): Promise<Challenge[]> {
  const raw = await apiFetch<RawChallenge[]>("/challenges");
  return raw.map(mapChallenge);
}

export async function claimChallenge(id: number): Promise<{ success: boolean }> {
  return apiFetch(`/challenges/${id}/claim`, { method: "POST" });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

interface RawLeaderboard {
  rank: number;
  username: string;
  xp: number;
  is_user: boolean;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const raw = await apiFetch<RawLeaderboard[]>("/leaderboard");
  return raw.map((r) => ({
    rank: r.rank,
    username: r.username,
    xp: r.xp,
    isUser: r.is_user,
  }));
}

// ── Weather ───────────────────────────────────────────────────────────────────

export async function fetchWeather(city: string): Promise<WeatherData> {
  return apiFetch<WeatherData>(`/weather?city=${encodeURIComponent(city)}`);
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function fetchAnalytics(): Promise<AnalyticsData> {
  return apiFetch<AnalyticsData>("/analytics");
}

// ── Chat (AI Coach) ───────────────────────────────────────────────────────────

export async function sendChatMessage(message: string, context?: string): Promise<{ reply: string }> {
  return apiFetch("/chat", {
    method: "POST",
    body: JSON.stringify({ message, context }),
  });
}
