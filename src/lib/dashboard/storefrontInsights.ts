/**
 * Types and guards for the business dashboard storefront insights (profile views, posts).
 */

export const PROFILE_VIEW_RANGES = ["month", "6months", "year"] as const;

export type ProfileViewRange = (typeof PROFILE_VIEW_RANGES)[number];

export type ProfileViewPoint = { label: string; views: number };

export type TopLikedPostSummary = {
  id: string;
  content: string;
  likeCount: number;
  created_at: string;
};

export type ViewPeriodComparison = { recent: number; previous: number };

/**
 * Discriminated result for dashboard insight fetches — callers branch on `ok` for type-safe handling.
 */
export type InsightsResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function isProfileViewRange(value: string): value is ProfileViewRange {
  return (PROFILE_VIEW_RANGES as readonly string[]).includes(value);
}

/** Safe, user-facing copy from thrown values, Supabase errors, or unknown. */
export function toUserFacingError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return "Something went wrong. Please try again.";
}

export function okResult<T>(data: T): InsightsResult<T> {
  return { ok: true, data };
}

export function errResult(message: string): InsightsResult<never> {
  return { ok: false, error: message };
}
