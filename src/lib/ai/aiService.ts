/**
 * Client-side handling of Edge function responses (Groq runs on the server in `_shared/aiService.ts`).
 * Use these helpers to normalize payloads and trigger local fallbacks when needed.
 */

import { CHAT_FALLBACK_MESSAGE } from "./aiFallback.ts";
import { validateGroqChatCompletionJson } from "./aiValidator.ts";

const LOG_TAG = "[AI:client]";

export interface ChatInvokeResult {
  message: string;
  fallback: boolean;
}

export interface RecommendInvokeResult {
  recommendedIds: string[];
  fallback: boolean;
}

/** Normalize chat Edge JSON; trust Edge validation — only guard missing/empty payloads here. */
export function parseChatEdgeResponse(data: unknown): ChatInvokeResult {
  if (data === null || typeof data !== "object") {
    console.warn(JSON.stringify({ tag: LOG_TAG, event: "chat_invalid_payload", fallback: true }));
    return { message: CHAT_FALLBACK_MESSAGE, fallback: true };
  }
  const d = data as { message?: unknown; fallback?: unknown };
  const raw = d.message;
  if (typeof raw !== "string" || !raw.trim()) {
    console.warn(JSON.stringify({ tag: LOG_TAG, event: "chat_missing_message", fallback: true }));
    return { message: CHAT_FALLBACK_MESSAGE, fallback: true };
  }
  return { message: raw.trim(), fallback: Boolean(d.fallback) };
}

/** Normalize recommend Edge JSON. */
export function parseRecommendEdgeResponse(data: unknown): RecommendInvokeResult {
  if (data === null || typeof data !== "object") {
    console.warn(JSON.stringify({ tag: LOG_TAG, event: "recommend_invalid_payload", fallback: true }));
    return { recommendedIds: [], fallback: true };
  }
  const d = data as { recommendedIds?: unknown; fallback?: unknown };
  const ids = d.recommendedIds;
  if (!Array.isArray(ids)) {
    return { recommendedIds: [], fallback: true };
  }
  const out: string[] = [];
  for (const x of ids) {
    if (typeof x === "string" && x.trim()) out.push(x);
  }
  return { recommendedIds: out, fallback: Boolean(d.fallback) };
}

/**
 * Optional: validate a raw Groq-shaped object if passed through for testing.
 * Not used in normal chat flow (Edge already validates).
 */
export function safeParseGroqJson(data: unknown) {
  return validateGroqChatCompletionJson(data);
}
