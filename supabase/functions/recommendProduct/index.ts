// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGroqChatCompletion } from "../_shared/aiService.ts";
import {
  indicesToRecommendedIds,
  parseRecommendIndicesFromAssistantText,
  validateGroqChatCompletionJson,
} from "../_shared/aiValidator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizeTextField(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (Array.isArray(value)) {
    const parts = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }
  return null;
}

function normalizeListValue(value: string | string[] | undefined | null) {
  const normalized = normalizeTextField(value);
  return normalized ?? "None";
}

function validateRecommendProductRequest(body: unknown) {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  const request = body as Record<string, unknown>;
  const productContext = request.productContext;
  if (!productContext || typeof productContext !== "object") {
    return { ok: false, message: "productContext must be an object." };
  }

  const rawPrice = (productContext as Record<string, unknown>).price;
  if (rawPrice !== undefined && rawPrice !== null && typeof rawPrice !== "number") {
    return { ok: false, message: "productContext.price must be a number when provided." };
  }

  const rawProducts = request.products;
  if (!Array.isArray(rawProducts)) {
    return { ok: false, message: "products must be an array." };
  }

  const normalizedProducts = [] as Array<Record<string, unknown>>;
  for (let index = 0; index < rawProducts.length; index += 1) {
    const item = rawProducts[index];
    if (!item || typeof item !== "object") {
      return { ok: false, message: `products[${index}] must be an object.` };
    }

    const product = item as Record<string, unknown>;
    const id = product.id;
    const name = product.name;

    if (typeof id !== "string" || !id.trim()) {
      return { ok: false, message: `products[${index}].id must be a non-empty string.` };
    }
    if (typeof name !== "string" || !name.trim()) {
      return { ok: false, message: `products[${index}].name must be a non-empty string.` };
    }

    normalizedProducts.push({
      ...product,
      id: id.trim(),
      name: name.trim(),
      tags: normalizeTextField(product.tags),
      category: normalizeTextField(product.category),
      description: normalizeTextField(product.description),
    });
  }

  return {
    ok: true,
    value: {
      productContext: {
        product_name: normalizeTextField((productContext as Record<string, unknown>).product_name),
        description: normalizeTextField((productContext as Record<string, unknown>).description),
        category: normalizeTextField((productContext as Record<string, unknown>).category),
        tags: normalizeTextField((productContext as Record<string, unknown>).tags),
        price: typeof rawPrice === "number" ? rawPrice : undefined,
      },
      products: normalizedProducts,
    },
  };
}

function buildSystemPrompt(
  products,
  productContext
) {
  const productList = products
    .map((p) => {
      const tags = normalizeListValue(p.tags);
      const category = normalizeListValue(p.category);
      return `[${p.index}] ${p.name} | Category: ${category} | Tags: ${tags} | Price: ${p.price} | Business Name: ${p.business_name} | Favorited: ${p.users_favorited ?? 0}`;
    })
    .join("\n");

  const productSection = `User interests:
- Product Tags: ${normalizeListValue(productContext?.tags)}
- Product Category: ${normalizeListValue(productContext?.category)}
- Product Description: ${normalizeListValue(productContext?.description)}
- Product Name: ${normalizeListValue(productContext?.product_name)}

Pick the at most 5 products that match this one. Prioritize name and description overlap. Do NOT force a connection between products, it is ok if you cannot find 5 similar products.`;

  return `You are a recommendation engine for The Yard Exchange, a student marketplace at Howard University.

${productSection}

Available products (use the number in brackets as the index):
${productList}

IMPORTANT: Respond with ONLY a JSON array of selected products index numbers from the list above.
Example: [0, 3, 7, 12]
No names, no explanations, no markdown. Only the array.`;
}

serve(async (req: Request) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body.", recommendedIds: [] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validation = validateRecommendProductRequest(requestBody);
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: validation.message, recommendedIds: [] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { productContext, products } = validation.value;
    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      throw new Error("GROQ_API_KEY not configured");
    }

    if (!Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify({ recommendedIds: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const indexedProducts = products.map((p, i) => ({ ...p, index: i }));
    const systemPrompt = buildSystemPrompt(indexedProducts, productContext);

    const groqResult = await callGroqChatCompletion({
      apiKey,
      model: "llama-3.1-8b-instant",
      maxTokens: 64,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Return the JSON array of at most 5 indices now." },
      ],
      operation: "recommend-product",
    });

    if (!groqResult.ok) {
      throw new Error(`Groq API error: ${groqResult.message}`);
    }

    const groqValidation = validateGroqChatCompletionJson(groqResult.data);
    if (!groqValidation.ok) {
      throw new Error(`Invalid Groq response: ${groqValidation.message}`);
    }

    const indicesValidation = parseRecommendIndicesFromAssistantText(groqValidation.value.content);
    if (!indicesValidation.ok) {
      throw new Error(`Failed to parse indices: ${indicesValidation.message}`);
    }

    const recommendedIdsValidation = indicesToRecommendedIds(indicesValidation.value, products);
    if (!recommendedIdsValidation.ok) {
      // If no valid recommendations, return empty array instead of error
      return new Response(JSON.stringify({ recommendedIds: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ recommendedIds: recommendedIdsValidation.value }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, recommendedIds: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
