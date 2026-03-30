/**
 * Re-exports shared AI validation used by the app and Jest (single source: Supabase Edge _shared).
 */
export {
  validateGroqChatCompletionJson,
  validateAssistantMessageForChat,
  scoreAssistantMessageQuality,
  validateChatRequestBody,
  validateRecommendRequestBody,
  parseRecommendIndicesFromAssistantText,
  indicesToRecommendedIds,
  type ValidationError,
  type ValidationResult,
  type GroqChatCompletionJson,
  type RecommendBusinessInput,
} from "../../../supabase/functions/_shared/aiValidator.ts";
