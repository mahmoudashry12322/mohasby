import type { AssistantProvider, StreamChatParams } from "./types";

/**
 * Google Gemini provider — REST streaming via streamGenerateContent.
 *
 * Current model (Oct 2026): gemini-3.8-flash
 * (gemini-2.0-flash was deprecated and shut down in H1 2026)
 *
 * Supports 1M token input, 65K output.
 */
export class GeminiProvider implements AssistantProvider {
  readonly name = "gemini";
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY environment variable is required");
    this.apiKey = key;
    this.model = process.env.ASSISTANT_MODEL || "gemini-3.8-flash";
  }

  async *streamChat(params: StreamChatParams): AsyncGenerator<string> {
    const { system, messages, signal } = params;

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body = JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.3,
      },
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Gemini API error ${response.status}: ${text.slice(0, 200)}`,
      );
    }

    if (!response.body) {
      throw new Error("Gemini API returned no stream body");
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
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);

          try {
            const parsed = JSON.parse(data);
            const text =
              parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              yield text;
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
