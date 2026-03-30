/**
 * Fallback strategies when AI fails validation, errors, or returns low-quality output.
 * Includes optional in-memory cache of last successful payloads (Edge: per isolate).
 */

import type { ValidationError } from "./aiValidator.ts";

export const CHAT_FALLBACK_MESSAGE =
  "I couldn’t generate a reply right now. Please try again in a moment — the marketplace listings are still here for you to browse.";

export const RECOMMEND_EMPTY_RESPONSE = { recommendedIds: [] as string[], fallback: true as const };

export type FallbackReason =
  | "api_error"
  | "validation_failed"
  | "timeout"
  | "empty_ai"
  | "low_confidence";

export interface ChatFallbackResult {
  message: string;
  usedCache: boolean;
  usedDefault: boolean;
  reason: FallbackReason;
  validationError?: ValidationError;
}

export interface RecommendFallbackResult {
  recommendedIds: string[];
  usedCache: boolean;
  usedDeterministic: boolean;
  usedDefault: boolean;
  reason: FallbackReason;
}

/** Simple TTL cache for last valid outputs (same Edge isolate). */
const chatCache: { value: string | null; expiresAt: number } = { value: null, expiresAt: 0 };
const recommendCache: { value: string[] | null; expiresAt: number } = { value: null, expiresAt: 0 };
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export function cacheLastValidChatMessage(message: string): void {
  chatCache.value = message;
  chatCache.expiresAt = Date.now() + CACHE_TTL_MS;
}

export function getCachedChatMessage(): string | null {
  if (!chatCache.value || Date.now() > chatCache.expiresAt) {
    chatCache.value = null;
    return null;
  }
  return chatCache.value;
}

export function cacheLastValidRecommendIds(ids: string[]): void {
  recommendCache.value = ids;
  recommendCache.expiresAt = Date.now() + CACHE_TTL_MS;
}

export function getCachedRecommendIds(): string[] | null {
  if (!recommendCache.value || Date.now() > recommendCache.expiresAt) {
    recommendCache.value = null;
    return null;
  }
  return recommendCache.value;
}

export function resolveChatFallback(
  reason: FallbackReason,
  validationError?: ValidationError,
): ChatFallbackResult {
  const cached = getCachedChatMessage();
  if (cached) {
    return {
      message: cached,
      usedCache: true,
      usedDefault: false,
      reason,
      validationError,
    };
  }
  return {
    message: CHAT_FALLBACK_MESSAGE,
    usedCache: false,
    usedDefault: true,
    reason,
    validationError,
  };
}

/** Deterministic top-N by favorites, then stable id sort (non-AI). */
export function deterministicRecommendIds(
  businesses: Array<{ id: string; users_favorited?: number }>,
  count = 4,
): string[] {
  if (businesses.length === 0) return [];
  const sorted = [...businesses].sort((a, b) => {
    const favA = a.users_favorited ?? 0;
    const favB = b.users_favorited ?? 0;
    if (favB !== favA) return favB - favA;
    return a.id.localeCompare(b.id);
  });
  return sorted.slice(0, Math.min(count, sorted.length)).map((b) => b.id);
}

/** Score-based pick using tags/categories overlap (still deterministic). */
export function deterministicRecommendIdsWithContext(
  businesses: Array<{
    id: string;
    name?: string;
    users_favorited?: number;
    tags?: string[];
    category?: string;
  }>,
  userContext?: {
    recent_tags?: string[];
    favorite_categories?: string[];
    recent_searches?: string[];
  },
  count = 4,
): string[] {
  if (businesses.length === 0) return [];

  const tagSet = new Set((userContext?.recent_tags ?? []).map((t) => t.toLowerCase()));
  const catSet = new Set((userContext?.favorite_categories ?? []).map((c) => c.toLowerCase()));
  const searchTerms = (userContext?.recent_searches ?? []).map((s) => s.toLowerCase());

  const scored = businesses.map((b, index) => {
    let score = (b.users_favorited ?? 0) * 2;
    const tags = (b.tags ?? []).map((t) => t.toLowerCase());
    for (const t of tags) {
      if (tagSet.has(t)) score += 15;
    }
    const cat = (b.category ?? "").toLowerCase();
    if (cat && catSet.has(cat)) score += 20;
    for (const term of searchTerms) {
      if (term && (b.name?.toLowerCase?.().includes(term) || tags.some((x) => x.includes(term)))) {
        score += 5;
      }
    }
    return { id: b.id, score, index };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });

  const out: string[] = [];
  const seen = new Set<string>();
  for (const row of scored) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row.id);
    if (out.length >= count) break;
  }
  return out;
}

export function resolveRecommendFallback(
  reason: FallbackReason,
  businesses: Array<{
    id: string;
    users_favorited?: number;
    tags?: string[];
    category?: string;
  }>,
  userContext?: {
    recent_tags?: string[];
    favorite_categories?: string[];
    recent_searches?: string[];
  },
): RecommendFallbackResult {
  const cached = getCachedRecommendIds();
  if (cached && cached.length > 0) {
    const filtered = cached.filter((id) => businesses.some((b) => b.id === id));
    if (filtered.length > 0) {
      return {
        recommendedIds: filtered.slice(0, 4),
        usedCache: true,
        usedDeterministic: false,
        usedDefault: false,
        reason,
      };
    }
  }

  const deterministic = deterministicRecommendIdsWithContext(businesses, userContext, 4);
  if (deterministic.length > 0) {
    return {
      recommendedIds: deterministic,
      usedCache: false,
      usedDeterministic: true,
      usedDefault: false,
      reason,
    };
  }

  return {
    recommendedIds: [],
    usedCache: false,
    usedDeterministic: false,
    usedDefault: true,
    reason,
  };
}
