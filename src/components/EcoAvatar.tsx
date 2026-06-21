"use client";

import React from "react";

// ──────────────────────────────────────────────────────
// EcoAvatar — Premium SVG avatar system
// Categories: walker | cyclist | transit | driver | balanced
// Evolutions: Seed → Sapling → Young Tree → Forest Guardian → Earth Protector
// ──────────────────────────────────────────────────────

interface EcoAvatarProps {
  avatarType?: string;
  ecoHealthLevel?: string;
  username?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showEvolutionBadge?: boolean;
}

const SIZE_MAP = {
  xs: 28,
  sm: 40,
  md: 56,
  lg: 96,
  xl: 140,
};

// Category theme colors
const AVATAR_THEMES: Record<string, { bg: string; ring: string; accent: string; label: string }> = {
  walker: {
    bg: "#D1FAE5",
    ring: "#34D399",
    accent: "#059669",
    label: "Walker",
  },
  cyclist: {
    bg: "#DCFCE7",
    ring: "#4ADE80",
    accent: "#16A34A",
    label: "Cyclist",
  },
  transit: {
    bg: "#DBEAFE",
    ring: "#60A5FA",
    accent: "#2563EB",
    label: "Transit",
  },
  driver: {
    bg: "#FEF3C7",
    ring: "#FCD34D",
    accent: "#D97706",
    label: "Driver",
  },
  balanced: {
    bg: "#F0FDF4",
    ring: "#86EFAC",
    accent: "#2E5E4E",
    label: "Balanced",
  },
};

// Evolution stage → overlay icon path (inline SVG path data)
type EvolutionKey = "Seed" | "Sapling" | "Young Tree" | "Forest Guardian" | "Earth Protector";

const EVOLUTION_BADGES: Record<EvolutionKey, { emoji: string; color: string; bg: string }> = {
  "Seed": { emoji: "🌱", color: "#059669", bg: "#D1FAE5" },
  "Sapling": { emoji: "🌿", color: "#16A34A", bg: "#DCFCE7" },
  "Young Tree": { emoji: "🌳", color: "#15803D", bg: "#BBFEF7" },
  "Forest Guardian": { emoji: "🌲", color: "#2E5E4E", bg: "#A7F3D0" },
  "Earth Protector": { emoji: "🌍", color: "#1D4ED8", bg: "#BFDBFE" },
};

// Category icon paths (minimalist flat icons drawn in 24×24 viewBox)
// These are simple geometric shapes representing each commute type
function CategoryIcon({ type, color, size }: { type: string; color: string; size: number }) {
  const s = size * 0.38;
  switch (type) {
    case "walker":
      return (
        <g transform={`translate(${size / 2 - s * 0.5}, ${size / 2 - s * 0.55}) scale(${s / 24})`}>
          {/* Minimalist walking person */}
          <circle cx="12" cy="4" r="3" fill={color} />
          <path d="M9 9 L8 16 L10 16 L12 13 L14 16 L16 16 L14 9 Z" fill={color} />
          <path d="M8 16 L6.5 21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14 16 L15.5 21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );
    case "cyclist":
      return (
        <g transform={`translate(${size / 2 - s * 0.5}, ${size / 2 - s * 0.45}) scale(${s / 24})`}>
          {/* Bicycle */}
          <circle cx="7" cy="16" r="4" fill="none" stroke={color} strokeWidth="2" />
          <circle cx="17" cy="16" r="4" fill="none" stroke={color} strokeWidth="2" />
          <path d="M7 16 L12 8 L17 16" fill="none" stroke={color} strokeWidth="1.8" />
          <path d="M9 8 L14 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="5" r="2.2" fill={color} />
        </g>
      );
    case "transit":
      return (
        <g transform={`translate(${size / 2 - s * 0.5}, ${size / 2 - s * 0.5}) scale(${s / 24})`}>
          {/* Metro/bus */}
          <rect x="4" y="4" width="16" height="13" rx="3" fill={color} />
          <rect x="7" y="7" width="4" height="3" rx="1" fill="white" opacity="0.8" />
          <rect x="13" y="7" width="4" height="3" rx="1" fill="white" opacity="0.8" />
          <circle cx="8" cy="20" r="2" fill={color} />
          <circle cx="16" cy="20" r="2" fill={color} />
          <path d="M6 17 L18 17" stroke="white" strokeWidth="0.8" opacity="0.5" />
        </g>
      );
    case "driver":
      return (
        <g transform={`translate(${size / 2 - s * 0.5}, ${size / 2 - s * 0.45}) scale(${s / 24})`}>
          {/* Car */}
          <path d="M4 14 L7 8 L17 8 L20 14 L20 18 L4 18 Z" fill={color} />
          <path d="M8 8 L9 5 L15 5 L16 8" fill={color} opacity="0.7" />
          <circle cx="8" cy="18" r="2.5" fill="white" opacity="0.9" />
          <circle cx="16" cy="18" r="2.5" fill="white" opacity="0.9" />
          <rect x="9" y="9" width="6" height="4" rx="1" fill="white" opacity="0.5" />
        </g>
      );
    default: // balanced
      return (
        <g transform={`translate(${size / 2 - s * 0.5}, ${size / 2 - s * 0.5}) scale(${s / 24})`}>
          {/* Leaf — balanced eco */}
          <path d="M12 21 C12 21 4 16 4 9 C4 5 8 3 12 3 C16 3 20 5 20 9 C20 16 12 21 12 21Z" fill={color} />
          <path d="M12 21 L12 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 14 C10 13 12 12 14 11" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </g>
      );
  }
}

export default function EcoAvatar({
  avatarType = "transit",
  ecoHealthLevel = "Seed",
  username = "U",
  size = "md",
  className = "",
  showEvolutionBadge = true,
}: EcoAvatarProps) {
  const px = SIZE_MAP[size];
  const theme = AVATAR_THEMES[avatarType] || AVATAR_THEMES.balanced;
  const evolution = EVOLUTION_BADGES[ecoHealthLevel as EvolutionKey] || EVOLUTION_BADGES["Seed"];
  const badgeSize = Math.max(16, Math.round(px * 0.32));
  const ringWidth = Math.max(2, Math.round(px * 0.055));

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: px, height: px }}
      title={`${username} · ${theme.label} · ${ecoHealthLevel}`}
    >
      {/* Main Avatar Circle */}
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer glow ring */}
        <circle
          cx={px / 2}
          cy={px / 2}
          r={px / 2 - 1}
          fill={theme.bg}
          stroke={theme.ring}
          strokeWidth={ringWidth}
        />
        {/* Subtle radial gradient overlay */}
        <defs>
          <radialGradient id={`grad-${avatarType}-${size}`} cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.55" />
            <stop offset="100%" stopColor={theme.bg} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle
          cx={px / 2}
          cy={px / 2}
          r={px / 2 - ringWidth}
          fill={`url(#grad-${avatarType}-${size})`}
        />
        {/* Category icon */}
        <CategoryIcon type={avatarType} color={theme.accent} size={px} />
      </svg>

      {/* Evolution Badge — bottom-right corner */}
      {showEvolutionBadge && (
        <div
          className="absolute flex items-center justify-center rounded-full border-2 border-white shadow-md"
          style={{
            width: badgeSize,
            height: badgeSize,
            bottom: -2,
            right: -2,
            background: evolution.bg,
            fontSize: badgeSize * 0.52,
            lineHeight: 1,
          }}
          title={ecoHealthLevel}
        >
          {evolution.emoji}
        </div>
      )}
    </div>
  );
}
