/**
 * AI output validation: JSON shape, required fields, types, and basic quality heuristics.
 * Pure functions — safe to use from Edge (Deno) or Jest (Node).
 */

export type ValidationErrorCode =
  | "INVALID_JSON"
  | "MISSING_FIELD"
  | "INVALID_TYPE"
  | "EMPTY_CONTENT"
  | "LOW_QUALITY"
  | "INVALID_INDICES"
  | "PARSE_ERROR";

export interface ValidationError {
  ok: false;
  code: ValidationErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

/** Groq OpenAI-compatible chat completion response (minimal shape). */
export interface GroqChatCompletionJson {
  choices?: Array<{
    message?: { content?: string | null; role?: string };
    finish_reason?: string;
  }>;
  usage?: { total_tokens?: number };
}

export function validateGroqChatCompletionJson(
  data: unknown,
): ValidationResult<{ content: string; finishReason?: string }> {
  if (data === null || typeof data !== "object") {
    return { ok: false, code: "INVALID_JSON", message: "Response is not a JSON object" };
  }
  const d = data as GroqChatCompletionJson;
  const content = d.choices?.[0]?.message?.content;
  if (content === undefined || content === null) {
    return {
      ok: false,
      code: "MISSING_FIELD",
      message: "Missing choices[0].message.content",
      details: { hasChoices: Array.isArray(d.choices) },
    };
  }
  if (typeof content !== "string") {
    return { ok: false, code: "INVALID_TYPE", message: "Assistant content must be a string" };
  }
  const finishReason = d.choices?.[0]?.finish_reason;
  return {
    ok: true,
    value: {
      content,
      finishReason: typeof finishReason === "string" ? finishReason : undefined,
    },
  };
}

const MIN_ASSISTANT_LENGTH = 2;
const MAX_ASSISTANT_LENGTH = 12000;

/** Heuristic quality: length bounds; optional keyword presence for campus context. */
export function scoreAssistantMessageQuality(content: string): {
  score: number;
  usable: boolean;
  reasons: string[];
} {
  const trimmed = content.trim();
  const reasons: string[] = [];
  let score = 100;

  if (trimmed.length < MIN_ASSISTANT_LENGTH) {
    reasons.push("too_short");
    score -= 60;
  }
  if (trimmed.length > MAX_ASSISTANT_LENGTH) {
    reasons.push("too_long");
    score -= 20;
  }

  const usable = score >= 40 && trimmed.length >= MIN_ASSISTANT_LENGTH;
  return { score: Math.max(0, score), usable, reasons };
}

export function validateAssistantMessageForChat(content: string): ValidationResult<string> {
  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, code: "EMPTY_CONTENT", message: "Assistant message is empty" };
  }
  const q = scoreAssistantMessageQuality(trimmed);
  if (!q.usable) {
    return {
      ok: false,
      code: "LOW_QUALITY",
      message: "Assistant message failed quality checks",
      details: { score: q.score, reasons: q.reasons },
    };
  }
  return { ok: true, value: trimmed };
}

export interface ChatRequestBody {
  messages?: unknown;
  businessContext?: unknown;
}

export function validateChatRequestBody(body: unknown): ValidationResult<{
  messages: Array<{ role: string; content: string }>;
  businessContext: { businesses: unknown[]; userContext?: string };
}> {
  if (body === null || typeof body !== "object") {
    return { ok: false, code: "INVALID_JSON", message: "Request body must be an object" };
  }
  const b = body as ChatRequestBody;
  if (!Array.isArray(b.messages)) {
    return { ok: false, code: "INVALID_TYPE", message: "messages must be an array" };
  }
  const messages: Array<{ role: string; content: string }> = [];
  for (const m of b.messages) {
    if (!m || typeof m !== "object") {
      return { ok: false, code: "INVALID_TYPE", message: "Each message must be an object" };
    }
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant" && role !== "system") {
      return { ok: false, code: "INVALID_TYPE", message: "Invalid message role" };
    }
    if (typeof content !== "string") {
      return { ok: false, code: "INVALID_TYPE", message: "Message content must be a string" };
    }
    messages.push({ role, content });
  }
  const ctx = b.businessContext;
  const businessContext =
    ctx && typeof ctx === "object" && Array.isArray((ctx as { businesses?: unknown }).businesses)
      ? {
          businesses: (ctx as { businesses: unknown[] }).businesses,
          userContext:
            typeof (ctx as { userContext?: unknown }).userContext === "string"
              ? (ctx as { userContext: string }).userContext
              : undefined,
        }
      : { businesses: [] as unknown[] };

  return { ok: true, value: { messages, businessContext } };
}

export interface RecommendRequestBody {
  userContext?: unknown;
  businesses?: unknown;
}

export type RecommendBusinessInput = {
  id: string;
  name?: string;
  users_favorited?: number;
  tags?: string[];
  category?: string;
  price_range?: [number, number] | null;
};

export function validateRecommendRequestBody(body: unknown): ValidationResult<{
  userContext?: {
    recent_tags?: string[];
    favorite_categories?: string[];
    recent_searches?: string[];
  };
  businesses: RecommendBusinessInput[];
}> {
  if (body === null || typeof body !== "object") {
    return { ok: false, code: "INVALID_JSON", message: "Request body must be an object" };
  }
  const b = body as RecommendRequestBody;
  if (!Array.isArray(b.businesses)) {
    return { ok: false, code: "INVALID_TYPE", message: "businesses must be an array" };
  }
  const businesses: RecommendBusinessInput[] = [];
  for (const item of b.businesses) {
    if (!item || typeof item !== "object") {
      return { ok: false, code: "INVALID_TYPE", message: "Each business must be an object" };
    }
    const id = (item as { id?: unknown }).id;
    if (typeof id !== "string" || !id.trim()) {
      return { ok: false, code: "INVALID_TYPE", message: "Each business must have a string id" };
    }
    const rawPrice = (item as { price_range?: unknown }).price_range;
    let price_range: [number, number] | null | undefined;
    if (rawPrice === null) {
      price_range = null;
    } else if (Array.isArray(rawPrice) && rawPrice.length >= 2) {
      const a = Number(rawPrice[0]);
      const c = Number(rawPrice[1]);
      if (Number.isFinite(a) && Number.isFinite(c)) price_range = [a, c];
    }
    businesses.push({
      id,
      name: typeof (item as { name?: unknown }).name === "string" ? (item as { name: string }).name : undefined,
      users_favorited:
        typeof (item as { users_favorited?: unknown }).users_favorited === "number"
          ? (item as { users_favorited: number }).users_favorited
          : undefined,
      tags: Array.isArray((item as { tags?: unknown }).tags)
        ? ((item as { tags: string[] }).tags as string[])
        : undefined,
      category:
        typeof (item as { category?: unknown }).category === "string"
          ? (item as { category: string }).category
          : undefined,
      price_range,
    });
  }

  let userContext:
    | {
        recent_tags?: string[];
        favorite_categories?: string[];
        recent_searches?: string[];
      }
    | undefined;
  const uc = b.userContext;
  if (uc !== undefined && uc !== null && typeof uc === "object") {
    userContext = {
      recent_tags: Array.isArray((uc as { recent_tags?: unknown }).recent_tags)
        ? ((uc as { recent_tags: string[] }).recent_tags as string[])
        : undefined,
      favorite_categories: Array.isArray((uc as { favorite_categories?: unknown }).favorite_categories)
        ? ((uc as { favorite_categories: string[] }).favorite_categories as string[])
        : undefined,
      recent_searches: Array.isArray((uc as { recent_searches?: unknown }).recent_searches)
        ? ((uc as { recent_searches: string[] }).recent_searches as string[])
        : undefined,
    };
  }

  return { ok: true, value: { userContext, businesses } };
}

/** Extract first JSON array of numbers from model text. */
export function parseRecommendIndicesFromAssistantText(text: string): ValidationResult<number[]> {
  const trimmed = text.trim();
  const match = trimmed.match(/\[[\s\S]*?\]/);
  if (!match) {
    return { ok: false, code: "PARSE_ERROR", message: "No JSON array found in AI response" };
  }
  try {
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) {
      return { ok: false, code: "INVALID_TYPE", message: "Parsed value is not an array" };
    }
    const indices: number[] = [];
    for (const x of parsed) {
      if (typeof x !== "number" || !Number.isFinite(x) || !Number.isInteger(x)) {
        return { ok: false, code: "INVALID_TYPE", message: "Array must contain only integers" };
      }
      indices.push(x);
    }
    return { ok: true, value: indices };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, code: "PARSE_ERROR", message: `JSON.parse failed: ${msg}` };
  }
}

export function indicesToRecommendedIds(
  indices: number[],
  businesses: Array<{ id: string }>,
): ValidationResult<string[]> {
  const ids: string[] = [];
  const seen = new Set<number>();
  for (const i of indices) {
    if (i < 0 || i >= businesses.length) continue;
    if (seen.has(i)) continue;
    seen.add(i);
    ids.push(businesses[i].id);
  }
  if (indices.length === 0) {
    return { ok: true, value: [] };
  }
  if (ids.length === 0) {
    return {
      ok: false,
      code: "INVALID_INDICES",
      message: "No valid indices mapped to business ids",
      details: { indices, businessCount: businesses.length },
    };
  }
  return { ok: true, value: ids };
}
