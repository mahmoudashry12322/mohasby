import type { AssistantProvider } from "./types";
import { GroqProvider } from "./groq";
import { GeminiProvider } from "./gemini";
import { MockProvider } from "./mock";

export * from "./types";
export { GroqProvider, GeminiProvider, MockProvider };

/**
 * Factory function to retrieve the configured AI assistant provider.
 * Supports: "groq" (default), "gemini", "mock".
 */
export function getAssistantProvider(overrideProvider?: string): AssistantProvider {
  const provider = (
    overrideProvider ||
    process.env.ASSISTANT_PROVIDER ||
    "groq"
  ).toLowerCase();

  switch (provider) {
    case "mock":
      return new MockProvider();
    case "gemini":
      return new GeminiProvider();
    case "groq":
    default:
      return new GroqProvider();
  }
}
