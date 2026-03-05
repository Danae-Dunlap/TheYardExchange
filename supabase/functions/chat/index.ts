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
    const { messages, businessContext } = await req.json();
    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");

    const systemPrompt = buildSystemPrompt(businessContext);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const message = data.choices[0].message.content;

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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
