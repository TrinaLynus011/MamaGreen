// ─────────────────────────────────────────────────────────────────────────────
// MamaGreen — Display Formatters
// Pure formatting utilities — no side effects, fully testable
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a number as Indian Rupees (₹)
 * Examples: 150 → "₹150", 1200 → "₹1,200"
 */
export function formatRupees(amount: number): string {
  if (amount < 0) return "₹0";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/**
 * Format carbon in kg with appropriate precision
 * Examples: 0.045 → "45 g", 1.5 → "1.50 kg", 10.0 → "10.0 kg"
 */
export function formatCarbon(kg: number): string {
  if (kg < 0.1) {
    return `${Math.round(kg * 1000)} g CO₂`;
  }
  return `${kg.toFixed(2)} kg CO₂`;
}

/**
 * Format a distance in km
 * Examples: 0.5 → "500 m", 2.3 → "2.3 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Format duration in minutes to human-readable
 * Examples: 5 → "5 min", 90 → "1 hr 30 min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}

/**
 * Format calories
 * Examples: 120 → "120 kcal", 0 → "—"
 */
export function formatCalories(kcal: number): string {
  if (kcal <= 0) return "—";
  return `${Math.round(kcal)} kcal`;
}

/**
 * Format steps count with thousands separator
 * Examples: 4200 → "4,200 steps"
 */
export function formatSteps(steps: number): string {
  return `${steps.toLocaleString("en-IN")} steps`;
}

/**
 * Truncate a string to a max length with ellipsis
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen - 1)}…`;
}

/**
 * Format a date string (YYYY-MM-DD) to a human-readable short date
 * Examples: "2026-06-19" → "Jun 19"
 */
export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

/**
 * Format percentage
 * Examples: 67.4 → "67%"
 */
export function formatPercent(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

/**
 * Get a greeting based on current local time
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

/**
 * Sanitize a string — strip HTML tags and trim whitespace
 * Used before sending user input to the backend
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // remove HTML tags
    .replace(/[<>&"'`]/g, "") // remove XSS-prone characters
    .trim();
}

/**
 * Validate an age value
 */
export function isValidAge(age: number): boolean {
  return Number.isInteger(age) && age >= 5 && age <= 120;
}

/**
 * Validate a distance value (must be positive, max 500 km per trip)
 */
export function isValidDistance(km: number): boolean {
  return km > 0 && km <= 500;
}
