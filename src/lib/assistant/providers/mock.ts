import type { AssistantProvider, StreamChatParams } from "./types";

export class MockProvider implements AssistantProvider {
  readonly name = "mock";
  private readonly defaultResponse: string;

  constructor(defaultResponse = "مرحباً بك في محاسبي! أنا مرشدك الذكي للنظام.") {
    this.defaultResponse = defaultResponse;
  }

  async *streamChat(params: StreamChatParams): AsyncGenerator<string> {
    const { signal } = params;
    const words = this.defaultResponse.split(" ");

    for (const word of words) {
      if (signal.aborted) {
        throw new Error("Stream aborted");
      }
      // Small artificial delay if needed, or immediate
      yield word + " ";
    }
  }
}
