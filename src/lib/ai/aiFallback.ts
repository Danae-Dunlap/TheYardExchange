/**
 * Re-exports fallback helpers (deterministic recommendations, safe defaults, cache contract).
 */
export {
  CHAT_FALLBACK_MESSAGE,
  RECOMMEND_EMPTY_RESPONSE,
  cacheLastValidChatMessage,
  getCachedChatMessage,
  cacheLastValidRecommendIds,
  getCachedRecommendIds,
  resolveChatFallback,
  deterministicRecommendIds,
  deterministicRecommendIdsWithContext,
  resolveRecommendFallback,
  type ChatFallbackResult,
  type RecommendFallbackResult,
  type FallbackReason,
} from "../../../supabase/functions/_shared/aiFallback.ts";
