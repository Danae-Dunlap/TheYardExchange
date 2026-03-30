// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGroqChatCompletion, mapGroqFailureToReason } from "../_shared/aiService.ts";
import {
  validateAssistantMessageForChat,
  validateChatRequestBody,
  validateGroqChatCompletionJson,
} from "../_shared/aiValidator.ts";
import { cacheLastValidChatMessage, resolveChatFallback } from "../_shared/aiFallback.ts";

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
      const fb = resolveChatFallback("validation_failed");
      return jsonResponse(
        { message: fb.message, fallback: true, meta: { reason: fb.reason } },
        200,
      );
    }

    const validated = validateChatRequestBody(body);
    if (!validated.ok) {
      console.warn(
        JSON.stringify({ tag: "[AI]", operation: "chat", event: "validation_failed", error: validated }),
      );
      const fb = resolveChatFallback("validation_failed", validated);
      return jsonResponse(
        { message: fb.message, fallback: true, meta: { reason: fb.reason, code: validated.code } },
        200,
      );
    }

    const { messages, businessContext } = validated.value;
    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      console.error(JSON.stringify({ tag: "[AI]", operation: "chat", event: "missing_api_key" }));
      const fb = resolveChatFallback("api_error");
      return jsonResponse({ message: fb.message, fallback: true, meta: { reason: fb.reason } }, 200);
    }

    const systemPrompt = buildSystemPrompt(businessContext);

    const groq = await callGroqChatCompletion({
      apiKey,
      operation: "chat",
      maxTokens: 1024,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    if (!groq.ok) {
      const reason = mapGroqFailureToReason(groq);
      console.warn(
        JSON.stringify({ tag: "[AI]", operation: "chat", event: "groq_failed", reason, detail: groq }),
      );
      const fb = resolveChatFallback(reason);
      return jsonResponse({ message: fb.message, fallback: true, meta: { reason: fb.reason } }, 200);
    }

    const parsed = validateGroqChatCompletionJson(groq.data);
    if (!parsed.ok) {
      console.warn(
        JSON.stringify({ tag: "[AI]", operation: "chat", event: "invalid_groq_shape", error: parsed }),
      );
      const fb = resolveChatFallback("validation_failed", parsed);
      return jsonResponse(
        { message: fb.message, fallback: true, meta: { reason: fb.reason, code: parsed.code } },
        200,
      );
    }

    const contentOk = validateAssistantMessageForChat(parsed.value.content);
    if (!contentOk.ok) {
      console.warn(
        JSON.stringify({ tag: "[AI]", operation: "chat", event: "assistant_validation_failed", error: contentOk }),
      );
      const fb = resolveChatFallback("low_confidence", contentOk);
      return jsonResponse(
        { message: fb.message, fallback: true, meta: { reason: fb.reason, code: contentOk.code } },
        200,
      );
    }

    cacheLastValidChatMessage(contentOk.value);
    return jsonResponse({ message: contentOk.value, fallback: false }, 200);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ tag: "[AI]", operation: "chat", event: "unhandled", error: msg }));
    const fb = resolveChatFallback("api_error");
    return jsonResponse({ message: fb.message, fallback: true, meta: { reason: fb.reason } }, 200);
  }
});

function jsonResponse(payload: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSystemPrompt(businessContext: { businesses: any[]; userContext?: string }): string {
  const businessList = businessContext.businesses
    .map((b) => {
      const price = b.price_range ? `$${b.price_range[0]}–$${b.price_range[1]}` : "Price not listed";
      const products = b.most_popular_products?.length
        ? b.most_popular_products.join(", ")
        : "None listed";
      return `Business: ${b.name}\n  Category: ${b.category}\n  Location: ${b.location}\n  Description: ${b.description}\n  Price: ${price}\n  Tags: ${b.tags?.join(", ") ?? "None"}\n  Popular Products/Services: ${products}`;
    })
    .join("\n\n");

  const userCtx = businessContext.userContext ? `\nUser context: ${businessContext.userContext}\n` : "";

  return `You are a helpful assistant for The Yard Exchange, a student marketplace at Howard University. You help students find businesses and services run by fellow students.
${userCtx}
Available businesses:
${businessList}

Guidelines:
- Be friendly and supportive, like a campus peer
- Recommend specific businesses by name with their category, location, and popular products/services
- Include contact info when available and relevant
- If no businesses match a query, say so honestly — never make up data
- Keep responses concise and actionable
- You can reference Howard University culture (HU! You know!)`;
}
