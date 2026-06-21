"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useUserStore, UserSettings } from "@/store/userStore";

// For backwards compatibility, map store fields to old Context shape
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
  ecoHealthLevel: string;
  carbonSaved: number;
  carbonToday: number;
  moneySaved: number;
  stepsToday: number;
  caloriesToday: number;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
  sprout: {
    name: string;
    level: number;
    mood: string;
    evolutionStage: string;
    xp: number;
    energy: number;
    xpNextLevel: number;
  };
}

interface UserContextValue {
  profile: UserProfile;
  settings: UserSettings;
  loading: boolean;
  backendActive: boolean;
  updateProfile: (changes: Partial<UserProfile>) => Promise<void>;
  updateSettings: (changes: Partial<UserSettings>) => Promise<void>;
  completeOnboarding: (payload: {
    fullName: string;
    age: number;
    location: string;
    commutePreference: string;
    email?: string;
  }) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  profile: {} as UserProfile,
  settings: {
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
  },
  loading: true,
  backendActive: false,
  updateProfile: async () => {},
  updateSettings: async () => {},
  completeOnboarding: async () => {},
  refreshProfile: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useUser(): UserContextValue {
  const storeProfile = useUserStore((state) => state.userProfile);
  const storeSettings = useUserStore((state) => state.settings);
  const storeLoading = useUserStore((state) => state.loading);
  const storeBackendActive = useUserStore((state) => state.backendActive);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const updateSettings = useUserStore((state) => state.updateSettings);
  const completeOnboarding = useUserStore((state) => state.completeOnboarding);
  const fetchProfile = useUserStore((state) => state.fetchProfile);

  // Map Zustand store to old Context interface for backwards compatibility
  const profile: UserProfile = useMemo(() => {
    return {
      id: storeProfile.id,
      username: storeProfile.name,
      age: storeProfile.age,
      primaryLocation: storeProfile.location,
      commutePreference: storeProfile.commuteType,
      avatarType: storeProfile.avatar,
      profileCompletion: storeProfile.profileCompletion,
      xp: storeProfile.xp,
      level: storeProfile.level,
      streak: storeProfile.streak,
      ecohealthScore: storeProfile.ecoHealthScore,
      ecoHealthLevel: storeProfile.ecoHealthLevel,
      carbonSaved: storeProfile.carbonSaved,
      carbonToday: storeProfile.carbonToday,
      moneySaved: storeProfile.moneySaved,
      stepsToday: storeProfile.stepsToday,
      caloriesToday: storeProfile.caloriesToday,
      createdAt: storeProfile.createdAt,
      updatedAt: storeProfile.updatedAt,
      onboardingCompleted: storeProfile.onboardingCompleted,
      sprout: {
        name: storeProfile.sprout?.name ?? "Sprout",
        level: storeProfile.sprout?.level ?? 1,
        mood: storeProfile.sprout?.mood ?? "Happy",
        evolutionStage: storeProfile.sprout?.evolutionStage ?? "Seed",
        xp: storeProfile.sprout?.xp ?? 0,
        energy: storeProfile.sprout?.energy ?? 100,
        xpNextLevel: storeProfile.sprout?.xpNextLevel ?? 100,
      },
    };
  }, [storeProfile]);

  return {
    profile,
    settings: storeSettings,
    loading: storeLoading,
    backendActive: storeBackendActive,
    updateProfile: async (changes) => {
      const payload: any = {};
      if (changes.username !== undefined) payload.name = changes.username;
      if (changes.age !== undefined) payload.age = changes.age;
      if (changes.primaryLocation !== undefined) payload.location = changes.primaryLocation;
      if (changes.commutePreference !== undefined) payload.commuteType = changes.commutePreference;
      if (changes.avatarType !== undefined) payload.avatar = changes.avatarType;
      
      await updateProfile(payload);
    },
    updateSettings,
    completeOnboarding: async (payload) => {
      await completeOnboarding(payload);
    },
    refreshProfile: fetchProfile,
  };
}
