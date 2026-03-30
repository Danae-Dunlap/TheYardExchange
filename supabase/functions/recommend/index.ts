// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGroqChatCompletion, mapGroqFailureToReason } from "../_shared/aiService.ts";
import {
  indicesToRecommendedIds,
  parseRecommendIndicesFromAssistantText,
  validateGroqChatCompletionJson,
  validateRecommendRequestBody,
} from "../_shared/aiValidator.ts";
import {
  cacheLastValidRecommendIds,
  resolveRecommendFallback,
} from "../_shared/aiFallback.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      console.warn(JSON.stringify({ tag: "[AI]", operation: "recommend", event: "invalid_json_body" }));
      return jsonResponse({ recommendedIds: [], fallback: true, meta: { reason: "validation_failed" } }, 200);
    }

    const validated = validateRecommendRequestBody(body);
    if (!validated.ok) {
      console.warn(
        JSON.stringify({ tag: "[AI]", operation: "recommend", event: "validation_failed", error: validated }),
      );
      return jsonResponse(
        { recommendedIds: [], fallback: true, meta: { reason: "validation_failed", code: validated.code } },
        200,
      );
    }

    const { userContext, businesses } = validated.value;
    if (businesses.length === 0) {
      return jsonResponse({ recommendedIds: [], fallback: true, meta: { reason: "empty_catalog" } }, 200);
    }

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      console.error(JSON.stringify({ tag: "[AI]", operation: "recommend", event: "missing_api_key" }));
      const fb = resolveRecommendFallback("api_error", businesses, userContext);
      return jsonResponse(
        {
          recommendedIds: fb.recommendedIds,
          fallback: true,
          meta: {
            reason: fb.reason,
            usedCache: fb.usedCache,
            usedDeterministic: fb.usedDeterministic,
          },
        },
        200,
      );
    }

    const indexedBusinesses = businesses.map((b, i) => ({ ...b, index: i }));
    const systemPrompt = buildSystemPrompt(indexedBusinesses, userContext);

    const groq = await callGroqChatCompletion({
      apiKey,
      operation: "recommend",
      maxTokens: 64,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Return the JSON array of 4 indices now." },
      ],
    });

    if (!groq.ok) {
      const reason = mapGroqFailureToReason(groq);
      console.warn(
        JSON.stringify({ tag: "[AI]", operation: "recommend", event: "groq_failed", reason, detail: groq }),
      );
      const fb = resolveRecommendFallback(reason, businesses, userContext);
      return jsonResponse(
        {
          recommendedIds: fb.recommendedIds,
          fallback: true,
          meta: {
            reason: fb.reason,
            usedCache: fb.usedCache,
            usedDeterministic: fb.usedDeterministic,
          },
        },
        200,
      );
    }

    const shape = validateGroqChatCompletionJson(groq.data);
    if (!shape.ok) {
      console.warn(
        JSON.stringify({ tag: "[AI]", operation: "recommend", event: "invalid_groq_shape", error: shape }),
      );
      const fb = resolveRecommendFallback("validation_failed", businesses, userContext);
      return jsonResponse(
        {
          recommendedIds: fb.recommendedIds,
          fallback: true,
          meta: { reason: fb.reason, code: shape.code },
        },
        200,
      );
    }

    const raw = shape.value.content.trim();
    const parsed = parseRecommendIndicesFromAssistantText(raw);
    if (!parsed.ok) {
      console.warn(
        JSON.stringify({ tag: "[AI]", operation: "recommend", event: "parse_indices_failed", error: parsed }),
      );
      const fb = resolveRecommendFallback("validation_failed", businesses, userContext);
      return jsonResponse(
        {
          recommendedIds: fb.recommendedIds,
          fallback: true,
          meta: { reason: fb.reason, code: parsed.code },
        },
        200,
      );
    }

    const idsResult = indicesToRecommendedIds(parsed.value, businesses);
    if (!idsResult.ok) {
      console.warn(
        JSON.stringify({ tag: "[AI]", operation: "recommend", event: "indices_invalid", error: idsResult }),
      );
      const fb = resolveRecommendFallback("validation_failed", businesses, userContext);
      return jsonResponse(
        {
          recommendedIds: fb.recommendedIds,
          fallback: true,
          meta: { reason: fb.reason, code: idsResult.code },
        },
        200,
      );
    }

    // Cap to four unique ids; if AI returned fewer than 4 valid, pad with deterministic picks
    let finalIds = idsResult.value.slice(0, 4);
    if (finalIds.length < 4) {
      const fb = resolveRecommendFallback("empty_ai", businesses, userContext);
      const merged: string[] = [...finalIds];
      const seen = new Set(merged);
      for (const id of fb.recommendedIds) {
        if (merged.length >= 4) break;
        if (!seen.has(id)) {
          seen.add(id);
          merged.push(id);
        }
      }
      finalIds = merged.slice(0, 4);
      cacheLastValidRecommendIds(finalIds);
      return jsonResponse(
        {
          recommendedIds: finalIds,
          fallback: finalIds.length < 4,
          meta: { padded: true },
        },
        200,
      );
    }

    cacheLastValidRecommendIds(finalIds);
    return jsonResponse({ recommendedIds: finalIds, fallback: false }, 200);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ tag: "[AI]", operation: "recommend", event: "unhandled", error: msg }));
    return jsonResponse({ recommendedIds: [], fallback: true, meta: { reason: "api_error" } }, 200);
  }
});

function jsonResponse(payload: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSystemPrompt(businesses: any[], userContext?: { recent_tags?: string[]; favorite_categories?: string[]; recent_searches?: string[] }): string {
  const hasActivity =
    (userContext?.recent_tags?.length ?? 0) > 0 ||
    (userContext?.favorite_categories?.length ?? 0) > 0 ||
    (userContext?.recent_searches?.length ?? 0) > 0;

  const businessList = businesses
    .map((b) => {
      const price = b.price_range ? `$${b.price_range[0]}–$${b.price_range[1]}` : "Price not listed";
      const label = b.name ?? "Business";
      return `[${b.index}] ${label} | Category: ${b.category ?? "—"} | Tags: ${b.tags?.join(", ") ?? "None"} | Price: ${price} | Favorited: ${b.users_favorited ?? 0}`;
    })
    .join("\n");

  const userSection = hasActivity
    ? `User interests:
- Recent tags viewed: ${userContext.recent_tags?.join(", ") || "None"}
- Favorite categories: ${userContext.favorite_categories?.join(", ") || "None"}
- Recent searches: ${userContext.recent_searches?.join(", ") || "None"}

Pick the 4 businesses that best match these interests. Prioritize tag and category overlap.`
    : `The user is new with no activity. Pick 4 broadly appealing businesses, favoring the highest "Favorited" count.`;

  return `You are a recommendation engine for The Yard Exchange, a student marketplace at Howard University.

${userSection}

Available businesses (use the number in brackets as the index):
${businessList}

IMPORTANT: Respond with ONLY a JSON array of exactly 4 index numbers from the list above.
Example: [0, 3, 7, 12]
No names, no explanations, no markdown. Only the array.`;
}
