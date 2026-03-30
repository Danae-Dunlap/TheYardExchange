import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchBusiness } from "@/lib/data/utils";
import { useAuth } from "@/contexts/AuthContext";
import { parseChatEdgeResponse } from "@/lib/ai/aiService";

type Role = "user" | "assistant";
interface Message { role: Role; content: string; }

const WELCOME: Message = {
  role: "assistant",
  content: "Hey Bison! I'm your Yard Exchange assistant. Ask me anything, I've got you. HU!",
};

export function useChat() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [businessContext, setBusinessContext] = useState<any>(null);

  useEffect(() => {
    if (businessContext) return;
    setIsLoadingContext(true);
    fetchBusiness()
      .then((businesses) => {
        if (!businesses) return;
        const trimmed = businesses.map((b) => ({
          name: b.name,
          category: b.category,
          location: b.location,
          description: (b.description ?? "").slice(0, 150),
          price_range: b.price_range ?? null,
          tags: b.tags ?? null,
          most_popular_products: b.most_popular_products ?? [],
        }));
        const userContext = profile?.recent_tags?.length
          ? `Recent interests: ${profile.recent_tags.slice(0, 5).join(", ")}`
          : undefined;
        setBusinessContext({ businesses: trimmed, userContext });
      })
      .finally(() => setIsLoadingContext(false));
  }, [profile]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const updated = [...messages, { role: "user" as Role, content: text }];
    setMessages(updated);
    setIsLoading(true);
    try {
      // Exclude welcome message from API call (it's UI-only)
      const apiMessages = updated.slice(1).map((m) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { messages: apiMessages, businessContext: businessContext ?? { businesses: [] } },
      });
      if (error) throw error;
      const parsed = parseChatEdgeResponse(data);
      if (parsed.fallback) {
        console.warn(JSON.stringify({ tag: "[AI:client]", event: "chat_used_fallback" }));
      }
      setMessages((prev) => [...prev, { role: "assistant", content: parsed.message }]);
    } catch (err: any) {
      if (err?.context) {
        err.context.json().then((body: any) => console.error("Chat error body:", body)).catch(() => {});
      }
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting. Try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading, isLoadingContext };
}
