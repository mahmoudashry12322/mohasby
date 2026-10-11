/** Shared types for AI assistant providers. */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantContext {
  /** Current user role: admin | accountant | auditor */
  userRole: string;
  /** Current UI locale: ar | en */
  locale: string;
  /** Current dashboard route slug, e.g. "accounting/journal-entries" */
  currentRoute: string;
}

export interface StreamChatParams {
  /** System prompt (includes knowledge base) */
  system: string;
  /** Conversation messages (last N, already validated) */
  messages: ChatMessage[];
  /** Server-side context injected into system prompt */
  context: AssistantContext;
  /** AbortSignal — abort if client disconnects or timeout */
  signal: AbortSignal;
}

export interface AssistantProvider {
  /** Provider identifier */
  readonly name: string;
  /**
   * Stream a chat completion.
   * Yields content token strings as they arrive.
   * The generator must respect the AbortSignal.
   */
  streamChat(params: StreamChatParams): AsyncGenerator<string, void, unknown>;
}
