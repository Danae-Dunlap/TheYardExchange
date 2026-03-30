/**
 * Groq (OpenAI-compatible) HTTP calls with timeout, error mapping, and structured logging.
 */

const GROQ_CHAT_COMPLETIONS = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.1-8b-instant";
const DEFAULT_TIMEOUT_MS = 25_000;

export interface GroqChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallGroqOptions {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  messages: GroqChatMessage[];
  timeoutMs?: number;
  /** Label for logs, e.g. "chat" | "recommend" */
  operation: string;
}

export type GroqCallResult =
  | { ok: true; status: number; data: unknown }
  | { ok: false; kind: "http_error" | "network" | "timeout" | "invalid_json"; message: string; status?: number };

function logAi(level: "info" | "warn" | "error", operation: string, msg: string, extra?: Record<string, unknown>) {
  const payload = { tag: "[AI]", operation, ...extra };
  const line = `${JSON.stringify(payload)} ${msg}`;
  if (level === "info") console.log(line);
  else if (level === "warn") console.warn(line);
  else console.error(line);
}

export async function callGroqChatCompletion(options: CallGroqOptions): Promise<GroqCallResult> {
  const {
    apiKey,
    model = DEFAULT_MODEL,
    maxTokens = 1024,
    messages,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    operation,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GROQ_CHAT_COMPLETIONS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages,
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      logAi("error", operation, "Groq API HTTP error", {
        status: response.status,
        bodyPreview: text.slice(0, 500),
      });
      return {
        ok: false,
        kind: "http_error",
        message: `Groq API error: ${response.status} ${text.slice(0, 200)}`,
        status: response.status,
      };
    }

    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logAi("error", operation, "Groq response not valid JSON", { parseError: msg });
      return { ok: false, kind: "invalid_json", message: `Invalid JSON from Groq: ${msg}` };
    }

    logAi("info", operation, "Groq call succeeded", { status: response.status });
    return { ok: true, status: response.status, data };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      logAi("warn", operation, "Groq request timed out", { timeoutMs });
      return { ok: false, kind: "timeout", message: `Request timed out after ${timeoutMs}ms` };
    }
    const msg = e instanceof Error ? e.message : String(e);
    logAi("error", operation, "Groq network/request error", { error: msg });
    return { ok: false, kind: "network", message: msg };
  } finally {
    clearTimeout(timer);
  }
}

export function mapGroqFailureToReason(result: GroqCallResult): "api_error" | "timeout" {
  if (!result.ok && result.kind === "timeout") return "timeout";
  return "api_error";
}
