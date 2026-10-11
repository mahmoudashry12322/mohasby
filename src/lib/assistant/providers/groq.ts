import type { AssistantProvider, StreamChatParams } from "./types";

/**
 * Groq provider — OpenAI-compatible chat completions API with SSE streaming.
 *
 * Groq rate limits (free tier, org-level):
 *   ~30 RPM, variable TPM depending on model.
 *   qwen/qwen3.8-27b: 131K context, reasoning model.
 *
 * We skip reasoning tokens (delta.reasoning / channel:"analysis")
 * and only yield delta.content tokens.
 */
export class GroqProvider implements AssistantProvider {
  readonly name = "groq";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor() {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY environment variable is required");
    this.apiKey = key;
    this.model = process.env.ASSISTANT_MODEL || "qwen/qwen3.8-27b";
    this.baseUrl =
      process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
  }

  async *streamChat(params: StreamChatParams): AsyncGenerator<string> {
    const { system, messages, signal } = params;

    const body = JSON.stringify({
      model: this.model,
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
      max_tokens: 2048,
      temperature: 0.3,
      reasoning_format: "hidden",
    });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body,
      signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Groq API error ${response.status}: ${text.slice(0, 200)}`,
      );
    }

    if (!response.body) {
      throw new Error("Groq API returned no stream body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            if (!delta) continue;

            // Skip reasoning tokens (Groq reasoning models emit these
            // with channel:"analysis" — we only want content tokens)
            if (delta.reasoning !== undefined && delta.content === undefined)
              continue;

            const content = delta.content;
            if (content) {
              yield content;
            }
          } catch {
            // Malformed JSON chunk — skip
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
