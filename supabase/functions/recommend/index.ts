// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userContext, businesses } = await req.json();
    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");

    // Map businesses to simple indices to prevent AI hallucinating UUIDs
    const indexedBusinesses = businesses.map((b: any, i: number) => ({ ...b, index: i }));
    const systemPrompt = buildSystemPrompt(indexedBusinesses, userContext);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 64,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Return the JSON array of 4 indices now." },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // Extract the JSON array of indices
    const match = content.match(/\[[\s\S]*?\]/);
    if (!match) throw new Error("No JSON array found in AI response");

    const indices: number[] = JSON.parse(match[0]);

    // Map indices back to real business IDs
    const recommendedIds = indices
      .filter((i) => i >= 0 && i < businesses.length)
      .map((i) => businesses[i].id);

    return new Response(JSON.stringify({ recommendedIds }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, recommendedIds: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildSystemPrompt(businesses: any[], userContext?: { recent_tags?: string[]; favorite_categories?: string[]; recent_searches?: string[] }): string {
  const hasActivity =
    (userContext?.recent_tags?.length ?? 0) > 0 ||
    (userContext?.favorite_categories?.length ?? 0) > 0 ||
    (userContext?.recent_searches?.length ?? 0) > 0;

  const businessList = businesses
    .map((b) => {
      const price = b.price_range ? `$${b.price_range[0]}–$${b.price_range[1]}` : "Price not listed";
      return `[${b.index}] ${b.name} | Category: ${b.category} | Tags: ${b.tags?.join(", ") ?? "None"} | Price: ${price} | Favorited: ${b.users_favorited ?? 0}`;
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
