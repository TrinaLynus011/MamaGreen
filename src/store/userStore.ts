import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { API_BASE_URL } from "@/constants";

export interface UserSettings {
  notificationsEnabled: boolean;
  darkMode: boolean;
  unitsPreference: "metric" | "imperial";
  privacyLevel: "public" | "private";
  accentColor: "forest" | "ocean" | "earth";
  weeklyCarbonTarget: number;
  weeklyStepsGoal: number;
  achievementAlerts: boolean;
  carbonMilestones: boolean;
  weeklySummaries: boolean;
  transitRecs: boolean;
  shareStats: boolean;
  publicProfile: boolean;
  rankingVisibility: boolean;
}

export interface SproutState {
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
  name: string;
  age: number;
  location: string;
  commuteType: string;
  avatar: string;
  ecoHealthScore: number;
  carbonSaved: number;
  moneySaved: number;
  streak: number;
  xp: number;
  level: number;
  carbonToday: number;
  stepsToday: number;
  caloriesToday: number;
  profileCompletion: number;
  ecoHealthLevel: string;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
  sprout: SproutState;
}

export interface UserStoreState {
  userProfile: UserProfile;
  settings: UserSettings;
  token: string | null;
  loading: boolean;
  backendActive: boolean;
  hydrated: boolean;

  hydrateFromStorage: () => void;
  fetchProfile: () => Promise<void>;
  completeOnboarding: (payload: {
    fullName: string;
    age: number;
    location: string;
    commutePreference: string;
    email?: string;
  }) => Promise<UserProfile>;
  updateProfile: (changes: Partial<Pick<UserProfile, "name" | "age" | "location" | "commuteType" | "avatar">>) => Promise<void>;
  applyProfilePatch: (changes: Partial<UserProfile>) => void;
  updateSettings: (changes: Partial<UserSettings>) => Promise<void>;
  syncAll: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
}

const STORE_KEY = "mamagreen_user_store";
const LEGACY_STATS_KEY = "mamagreen_stats";
const LEGACY_PROFILE_KEY = "mamagreen_profile";
const LEGACY_SETTINGS_KEY = "mamagreen_settings";

const DEFAULT_PROFILE: UserProfile = {
  id: 1,
  name: "Green Traveler",
  age: 25,
  location: "India Center",
  commuteType: "Mixed",
  avatar: "transit",
  ecoHealthScore: 78.5,
  carbonSaved: 42.3,
  moneySaved: 845.0,
  streak: 5,
  xp: 80,
  level: 3,
  carbonToday: 1.4,
  stepsToday: 4200,
  caloriesToday: 185.0,
  profileCompletion: 80,
  ecoHealthLevel: "Forest Guardian",
  createdAt: "",
  updatedAt: "",
  onboardingCompleted: false,
  sprout: {
    name: "Sprout",
    level: 3,
    mood: "Happy",
    evolutionStage: "Sprout",
    xp: 80,
    energy: 85,
    xpNextLevel: 300,
  },
};

const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  darkMode: false,
  unitsPreference: "metric",
  privacyLevel: "public",
  accentColor: "forest",
  weeklyCarbonTarget: 20,
  weeklyStepsGoal: 8000,
  achievementAlerts: true,
  carbonMilestones: true,
  weeklySummaries: true,
  transitRecs: true,
  shareStats: true,
  publicProfile: true,
  rankingVisibility: true,
};

type BackendProfile = {
  id: number;
  username?: string;
  name?: string;
  age: number;
  primary_location?: string;
  location?: string;
  commute_preference?: string;
  commute_type?: string;
  avatar_type?: string;
  avatar?: string;
  profile_completion?: number;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  xp?: number;
  level?: number;
  streak?: number;
  ecohealth_score?: number;
  ecohealth_level?: string;
  carbon_saved?: number;
  carbon_today?: number;
  money_saved?: number;
  steps_today?: number;
  calories_today?: number;
  settings?: Partial<UserSettings>;
  sprout?: {
    name?: string;
    level?: number;
    mood?: string;
    evolution_stage?: string;
    evolutionStage?: string;
    xp?: number;
    energy?: number;
    xp_next_level?: number;
    xpNextLevel?: number;
  };
};

function isClient() {
  return typeof window !== "undefined";
}

function getProfileCompletion(profile: UserProfile) {
  const required = [profile.name, profile.location, profile.commuteType, profile.avatar];
  const completeCount = required.filter(Boolean).length;
  return Math.round((completeCount / required.length) * 100);
}

function normalizeProfile(raw?: Partial<BackendProfile> | null): UserProfile {
  const base = { ...DEFAULT_PROFILE };
  if (!raw) {
    return base;
  }

  const name = raw.name ?? raw.username ?? base.name;
  const location = raw.location ?? raw.primary_location ?? (raw as any).location ?? base.location;
  const commuteType = raw.commute_type ?? raw.commute_preference ?? (raw as any).commuteType ?? base.commuteType;
  const avatar = raw.avatar ?? raw.avatar_type ?? (raw as any).avatar ?? base.avatar;
  const ecoHealthScore = raw.ecohealth_score ?? (raw as any).ecoHealthScore ?? base.ecoHealthScore;
  const carbonSaved = raw.carbon_saved ?? (raw as any).carbonSaved ?? base.carbonSaved;
  const moneySaved = raw.money_saved ?? (raw as any).moneySaved ?? base.moneySaved;
  const streak = raw.streak ?? base.streak;
  const xp = raw.xp ?? base.xp;
  const level = raw.level ?? base.level;
  const carbonToday = raw.carbon_today ?? (raw as any).carbonToday ?? base.carbonToday;
  const stepsToday = raw.steps_today ?? (raw as any).stepsToday ?? base.stepsToday;
  const caloriesToday = raw.calories_today ?? (raw as any).caloriesToday ?? base.caloriesToday;

  const sproutRaw = raw.sprout;
  const sprout: SproutState = sproutRaw ? {
    name: sproutRaw.name ?? base.sprout.name,
    level: sproutRaw.level ?? base.sprout.level,
    mood: sproutRaw.mood ?? base.sprout.mood,
    evolutionStage: sproutRaw.evolution_stage ?? sproutRaw.evolutionStage ?? base.sprout.evolutionStage,
    xp: sproutRaw.xp ?? base.sprout.xp,
    energy: sproutRaw.energy ?? base.sprout.energy,
    xpNextLevel: sproutRaw.xp_next_level ?? sproutRaw.xpNextLevel ?? base.sprout.xpNextLevel,
  } : (raw as any).sprout ?? base.sprout;

  const profile: UserProfile = {
    id: raw.id ?? base.id,
    name,
    age: raw.age ?? base.age,
    location,
    commuteType,
    avatar,
    ecoHealthScore,
    carbonSaved,
    moneySaved,
    streak,
    xp,
    level,
    carbonToday,
    stepsToday,
    caloriesToday,
    profileCompletion: raw.profile_completion ?? (raw as any).profileCompletion ?? getProfileCompletion(base),
    ecoHealthLevel: raw.ecohealth_level ?? (raw as any).ecoHealthLevel ?? base.ecoHealthLevel,
    createdAt: raw.created_at ?? base.createdAt,
    updatedAt: raw.updated_at ?? base.updatedAt,
    onboardingCompleted: raw.onboarding_completed ?? (raw as any).onboardingCompleted ?? base.onboardingCompleted,
    sprout,
  };

  profile.profileCompletion = raw.profile_completion ?? (raw as any).profileCompletion ?? getProfileCompletion(profile);
  profile.ecoHealthLevel = raw.ecohealth_level ?? (raw as any).ecoHealthLevel ?? profile.ecoHealthLevel;
  profile.onboardingCompleted = raw.onboarding_completed ?? (raw as any).onboardingCompleted ?? Boolean(profile.name && profile.location && profile.commuteType);
  return profile;
}

function persistSnapshots(profile: UserProfile, settings: UserSettings) {
  if (!isClient()) return;

  const storePayload = { userProfile: profile, settings };
  localStorage.setItem(STORE_KEY, JSON.stringify(storePayload));
  localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify(settings));
  localStorage.setItem(
    LEGACY_STATS_KEY,
    JSON.stringify({
      fullName: profile.name,
      username: profile.name,
      age: profile.age,
      city: profile.location,
      commuteMode: profile.commuteType,
      avatarType: profile.avatar,
      xp: profile.xp,
      level: profile.level,
      streak: profile.streak,
      ecohealthScore: profile.ecoHealthScore,
      carbonSaved: profile.carbonSaved,
      carbonToday: profile.carbonToday,
      moneySaved: profile.moneySaved,
      stepsToday: profile.stepsToday,
      caloriesToday: profile.caloriesToday,
      onboardingCompleted: profile.onboardingCompleted,
    })
  );
  localStorage.setItem("mamagreen_units", settings.unitsPreference);
}

function readLegacySnapshot(): { profile?: Partial<BackendProfile>; settings?: Partial<UserSettings> } {
  if (!isClient()) return {};

  const legacyStore = localStorage.getItem(STORE_KEY);
  if (legacyStore) {
    try {
      const parsed = JSON.parse(legacyStore) as { userProfile?: Partial<BackendProfile>; settings?: Partial<UserSettings> };
      return { profile: parsed.userProfile, settings: parsed.settings };
    } catch {
      // fall through to legacy keys
    }
  }

  const legacyStats = localStorage.getItem(LEGACY_STATS_KEY);
  const legacySettings = localStorage.getItem(LEGACY_SETTINGS_KEY);
  let profile: Partial<BackendProfile> | undefined;
  let settings: Partial<UserSettings> | undefined;

  if (legacyStats) {
    try {
      const parsed = JSON.parse(legacyStats);
      profile = {
        id: 1,
        username: parsed.fullName ?? parsed.username,
        name: parsed.fullName ?? parsed.username,
        age: parsed.age,
        primary_location: parsed.city,
        location: parsed.city,
        commute_preference: parsed.commuteMode,
        commute_type: parsed.commuteMode,
        avatar_type: parsed.avatarType ?? "transit",
        avatar: parsed.avatarType ?? "transit",
        xp: parsed.xp,
        level: parsed.level,
        streak: parsed.streak,
        ecohealth_score: parsed.ecohealthScore,
        carbon_saved: parsed.carbonSaved,
        carbon_today: parsed.carbonToday,
        money_saved: parsed.moneySaved,
        steps_today: parsed.stepsToday,
        calories_today: parsed.caloriesToday,
        onboarding_completed: parsed.onboardingCompleted,
      };
    } catch {
      profile = undefined;
    }
  }

  if (legacySettings) {
    try {
      settings = JSON.parse(legacySettings);
    } catch {
      settings = undefined;
    }
  }

  if (!settings && isClient()) {
    const unitsPreference = localStorage.getItem("mamagreen_units");
    if (unitsPreference === "imperial" || unitsPreference === "metric") {
      settings = { ...DEFAULT_SETTINGS, unitsPreference };
    }
  }

  return { profile, settings };
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const token = useUserStore.getState().token;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["X-Authorization"] = token;
  }
  
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(errorText || `Request failed with ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const useUserStore = create<UserStoreState>()(
  subscribeWithSelector((set, get) => ({
    userProfile: DEFAULT_PROFILE,
    settings: DEFAULT_SETTINGS,
    token: null,
    loading: true,
    backendActive: false,
    hydrated: false,

    hydrateFromStorage: () => {
      if (!isClient()) return;

      const legacy = readLegacySnapshot();
      const profile = normalizeProfile(legacy.profile ?? undefined);
      const settings = { ...DEFAULT_SETTINGS, ...(legacy.settings ?? {}) };
      const token = localStorage.getItem("mamagreen_token") || null;

      set({
        userProfile: profile,
        settings,
        token,
        hydrated: true,
        loading: false,
      });
      persistSnapshots(profile, settings);
    },

    fetchProfile: async () => {
      const token = get().token;
      if (!token) {
        set({ loading: false });
        return;
      }
      set({ loading: true });
      try {
        const res = await fetch(`${API_BASE_URL}/user/profile`, {
          cache: "no-store",
          headers: {
            "Authorization": `Bearer ${token}`,
            "X-Authorization": token
          }
        });
        if (!res.ok) {
          if (res.status === 401) {
            get().logout();
            return;
          }
          throw new Error(`Profile fetch failed: ${res.status}`);
        }
        const data = (await res.json()) as BackendProfile;
        const profile = normalizeProfile(data);
        const currentSettings = get().settings;
        const settings = {
          ...DEFAULT_SETTINGS,
          ...currentSettings,
          ...(data.settings ?? {})
        };
        set({ userProfile: profile, settings, backendActive: true, hydrated: true });
        persistSnapshots(profile, settings);
      } catch {
        const legacy = readLegacySnapshot();
        const profile = normalizeProfile(legacy.profile ?? undefined);
        const settings = { ...DEFAULT_SETTINGS, ...(legacy.settings ?? {}) };
        set({ userProfile: profile, settings, backendActive: false, hydrated: true });
        persistSnapshots(profile, settings);
      } finally {
        set({ loading: false });
      }
    },

    completeOnboarding: async (payload) => {
      try {
        const email = payload.email || `guest_${Date.now()}@mamagreen.com`;
        const registerPayload = {
          email,
          password: "guestPassword123",
          fullName: payload.fullName,
          age: payload.age,
          location: payload.location,
          commutePreference: payload.commutePreference
        };
        
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerPayload),
        });
        if (!res.ok) {
          throw new Error("Guest registration failed");
        }
        
        const data = await res.json() as { access_token: string; profile: BackendProfile };
        localStorage.setItem("mamagreen_token", data.access_token);
        const profile = normalizeProfile(data.profile);
        const settings = {
          ...DEFAULT_SETTINGS,
          ...(data.profile.settings ?? {})
        };
        set({
          token: data.access_token,
          userProfile: profile,
          settings,
          backendActive: true,
          hydrated: true,
          loading: false,
        });
        persistSnapshots(profile, settings);
        return profile;
      } catch (err) {
        // Fallback for offline mode: Simulate setup user response locally
        const simulatedBackendResponse: BackendProfile = {
          id: 1,
          name: payload.fullName,
          username: payload.fullName,
          age: payload.age,
          location: payload.location,
          primary_location: payload.location,
          commute_type: payload.commutePreference,
          commute_preference: payload.commutePreference,
          avatar: "transit",
          avatar_type: "transit",
          ecohealth_score: payload.commutePreference.toLowerCase() === "walking" || payload.commutePreference.toLowerCase() === "cycling" ? 75 : 60,
          ecohealth_level: payload.commutePreference.toLowerCase() === "walking" || payload.commutePreference.toLowerCase() === "cycling" ? "Smart Commuter" : "Eco Starter",
          carbon_saved: 0.0,
          carbon_today: 0.0,
          money_saved: 0.0,
          steps_today: 0,
          calories_today: 0.0,
          xp: 0,
          level: 1,
          streak: 1,
          onboarding_completed: true,
          profile_completion: 80,
          settings: DEFAULT_SETTINGS,
          sprout: {
            name: "Sprout",
            level: 1,
            mood: "Happy",
            evolution_stage: "Seed",
            xp: 0,
            energy: 100,
          }
        };
        const profile = normalizeProfile(simulatedBackendResponse);
        set({ userProfile: profile, settings: DEFAULT_SETTINGS, backendActive: false, hydrated: true, loading: false });
        persistSnapshots(profile, DEFAULT_SETTINGS);
        return profile;
      }
    },

    updateProfile: async (changes) => {
      const current = get().userProfile;
      const nextProfile: UserProfile = {
        ...current,
        ...changes,
        name: changes.name ?? current.name,
        age: changes.age ?? current.age,
        location: changes.location ?? current.location,
        commuteType: changes.commuteType ?? current.commuteType,
        avatar: changes.avatar ?? current.avatar,
        profileCompletion: getProfileCompletion({ ...current, ...changes } as UserProfile),
        onboardingCompleted: true,
      };

      set({ userProfile: nextProfile });
      persistSnapshots(nextProfile, get().settings);

      try {
        const data = await postJson<BackendProfile>("/user/update", {
          username: nextProfile.name,
          age: nextProfile.age,
          location: nextProfile.location,
          commutePreference: nextProfile.commuteType,
          avatarType: nextProfile.avatar,
        });
        const merged = normalizeProfile(data);
        set({ userProfile: merged, backendActive: true });
        persistSnapshots(merged, get().settings);
      } catch {
        set({ backendActive: false });
      }
    },

    applyProfilePatch: (changes) => {
      const merged = {
        ...get().userProfile,
        ...changes,
      };
      const normalized: UserProfile = {
        ...merged,
        profileCompletion: changes.profileCompletion ?? merged.profileCompletion ?? getProfileCompletion(merged),
        ecoHealthLevel: changes.ecoHealthLevel ?? merged.ecoHealthLevel,
        onboardingCompleted: changes.onboardingCompleted ?? merged.onboardingCompleted,
      };
      set({ userProfile: normalized });
      persistSnapshots(normalized, get().settings);
    },

    updateSettings: async (changes) => {
      const nextSettings = { ...get().settings, ...changes };
      set({ settings: nextSettings });
      persistSnapshots(get().userProfile, nextSettings);

      try {
        const data = await postJson<BackendProfile>("/user/settings", {
          notificationsEnabled: nextSettings.notificationsEnabled,
          darkMode: nextSettings.darkMode,
          unitsPreference: nextSettings.unitsPreference,
          privacyLevel: nextSettings.privacyLevel,
          accentColor: nextSettings.accentColor,
          weeklyCarbonTarget: nextSettings.weeklyCarbonTarget,
          weeklyStepsGoal: nextSettings.weeklyStepsGoal,
          achievementAlerts: nextSettings.achievementAlerts,
          carbonMilestones: nextSettings.carbonMilestones,
          weeklySummaries: nextSettings.weeklySummaries,
          transitRecs: nextSettings.transitRecs,
          shareStats: nextSettings.shareStats,
          publicProfile: nextSettings.publicProfile,
          rankingVisibility: nextSettings.rankingVisibility,
        });
        const merged = normalizeProfile(data);
        set({ userProfile: merged, settings: nextSettings, backendActive: true });
        persistSnapshots(merged, nextSettings);
      } catch {
        set({ backendActive: false });
      }
    },

    syncAll: async () => {
      const { userProfile, settings } = get();
      try {
        await Promise.all([
          postJson("/user/update", {
            username: userProfile.name,
            age: userProfile.age,
            location: userProfile.location,
            commutePreference: userProfile.commuteType,
            avatarType: userProfile.avatar,
          }),
          postJson("/user/settings", {
            notificationsEnabled: settings.notificationsEnabled,
            darkMode: settings.darkMode,
            unitsPreference: settings.unitsPreference,
            privacyLevel: settings.privacyLevel,
            accentColor: settings.accentColor,
            weeklyCarbonTarget: settings.weeklyCarbonTarget,
            weeklyStepsGoal: settings.weeklyStepsGoal,
            achievementAlerts: settings.achievementAlerts,
            carbonMilestones: settings.carbonMilestones,
            weeklySummaries: settings.weeklySummaries,
            transitRecs: settings.transitRecs,
            shareStats: settings.shareStats,
            publicProfile: settings.publicProfile,
            rankingVisibility: settings.rankingVisibility,
          }),
        ]);
        set({ backendActive: true });
      } catch {
        set({ backendActive: false });
      }
    },

    login: async (email, password) => {
      set({ loading: true });
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const errMsg = await res.text();
          let jsonMsg = errMsg;
          try {
            jsonMsg = JSON.parse(errMsg).detail;
          } catch {}
          throw new Error(jsonMsg || "Invalid credentials");
        }
        const data = await res.json() as { access_token: string; profile: BackendProfile };
        localStorage.setItem("mamagreen_token", data.access_token);
        const profile = normalizeProfile(data.profile);
        const settings = {
          ...DEFAULT_SETTINGS,
          ...(data.profile.settings ?? {})
        };
        set({
          token: data.access_token,
          userProfile: profile,
          settings,
          backendActive: true,
          hydrated: true,
        });
        persistSnapshots(profile, settings);
      } finally {
        set({ loading: false });
      }
    },

    register: async (payload) => {
      set({ loading: true });
      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errMsg = await res.text();
          let jsonMsg = errMsg;
          try {
            jsonMsg = JSON.parse(errMsg).detail;
          } catch {}
          throw new Error(jsonMsg || "Registration failed");
        }
        const data = await res.json() as { access_token: string; profile: BackendProfile };
        localStorage.setItem("mamagreen_token", data.access_token);
        const profile = normalizeProfile(data.profile);
        const settings = {
          ...DEFAULT_SETTINGS,
          ...(data.profile.settings ?? {})
        };
        set({
          token: data.access_token,
          userProfile: profile,
          settings,
          backendActive: true,
          hydrated: true,
        });
        persistSnapshots(profile, settings);
      } finally {
        set({ loading: false });
      }
    },

    logout: () => {
      if (isClient()) {
        localStorage.removeItem("mamagreen_token");
        localStorage.removeItem("mamagreen_stats");
        localStorage.removeItem("mamagreen_history");
        localStorage.removeItem("mamagreen_challenges");
      }
      set({
        token: null,
        userProfile: DEFAULT_PROFILE,
        settings: DEFAULT_SETTINGS,
        backendActive: false,
      });
    },
  }))
);

export const userStoreHelpers = {
  normalizeProfile,
  getProfileCompletion,
};
