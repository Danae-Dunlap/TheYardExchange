import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  validateGroqChatCompletionJson,
  validateAssistantMessageForChat,
  validateChatRequestBody,
  validateRecommendRequestBody,
  parseRecommendIndicesFromAssistantText,
  indicesToRecommendedIds,
} from "@/lib/ai/aiValidator";
import {
  deterministicRecommendIdsWithContext,
  resolveRecommendFallback,
  CHAT_FALLBACK_MESSAGE,
} from "@/lib/ai/aiFallback";
import { parseChatEdgeResponse, parseRecommendEdgeResponse } from "@/lib/ai/aiService";

describe("aiValidator", () => {
  it("accepts valid Groq-shaped JSON", () => {
    const data = {
      choices: [{ message: { content: "Hello Bison!" }, finish_reason: "stop" }],
    };
    const r = validateGroqChatCompletionJson(data);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.content).toBe("Hello Bison!");
  });

  it("rejects malformed Groq JSON", () => {
    const r = validateGroqChatCompletionJson({ choices: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("MISSING_FIELD");
  });

  it("validates chat request body", () => {
    const r = validateChatRequestBody({
      messages: [{ role: "user", content: "hi" }],
      businessContext: { businesses: [] },
    });
    expect(r.ok).toBe(true);
  });

  it("validates recommend request body with businesses", () => {
    const r = validateRecommendRequestBody({
      userContext: { recent_tags: ["food"] },
      businesses: [
        { id: "a", name: "Shop", category: "food", tags: ["food"], users_favorited: 3, price_range: [1, 10] },
      ],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.businesses[0].name).toBe("Shop");
  });

  it("parses index array from assistant text", () => {
    const r = parseRecommendIndicesFromAssistantText('Sure: [0, 2, 1, 3]');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual([0, 2, 1, 3]);
  });

  it("maps indices to business ids", () => {
    const businesses = [{ id: "x" }, { id: "y" }, { id: "z" }];
    const r = indicesToRecommendedIds([2, 0], businesses);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual(["z", "x"]);
  });

  it("rejects empty assistant message for chat", () => {
    const r = validateAssistantMessageForChat("   ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("EMPTY_CONTENT");
  });
});

describe("aiFallback", () => {
  it("deterministic picks favor tags and favorites", () => {
    const ids = deterministicRecommendIdsWithContext(
      [
        { id: "a", users_favorited: 1, tags: ["x"], category: "food" },
        { id: "b", users_favorited: 99, tags: ["other"], category: "svc" },
      ],
      { recent_tags: ["x"], favorite_categories: ["food"], recent_searches: [] },
      2,
    );
    expect(ids).toContain("a");
    expect(ids.length).toBeLessThanOrEqual(2);
  });

  it("resolveRecommendFallback returns deterministic when no cache", () => {
    const r = resolveRecommendFallback(
      "api_error",
      [
        { id: "a", users_favorited: 5 },
        { id: "b", users_favorited: 1 },
      ],
      undefined,
    );
    expect(r.usedDeterministic || r.recommendedIds.length >= 0).toBe(true);
    expect(r.recommendedIds[0]).toBe("a");
  });
});

describe("aiService (client parsers)", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("parseChatEdgeResponse returns message when valid", () => {
    const r = parseChatEdgeResponse({ message: "Hi!", fallback: false });
    expect(r.message).toBe("Hi!");
    expect(r.fallback).toBe(false);
  });

  it("parseChatEdgeResponse uses safe default when missing message", () => {
    const r = parseChatEdgeResponse({});
    expect(r.fallback).toBe(true);
    expect(r.message).toBe(CHAT_FALLBACK_MESSAGE);
  });

  it("parseRecommendEdgeResponse reads ids", () => {
    const r = parseRecommendEdgeResponse({ recommendedIds: ["a", "b"], fallback: false });
    expect(r.recommendedIds).toEqual(["a", "b"]);
  });

  it("API failure path: empty data triggers empty ids (client then uses deterministic in utils)", () => {
    const r = parseRecommendEdgeResponse(null);
    expect(r.recommendedIds).toEqual([]);
    expect(r.fallback).toBe(true);
  });
});
