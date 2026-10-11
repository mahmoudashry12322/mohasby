import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/server";
import { fail, HttpError } from "@/lib/server/http";
import { assistantChatRequestSchema } from "@/lib/assistant/validation";
import {
  checkRateLimit,
  recordRequest,
  acquireStreamLock,
  releaseStreamLock,
} from "@/lib/assistant/rate-limiter";
import { buildSystemPrompt } from "@/lib/assistant/system-prompt";
import { getAssistantProvider } from "@/lib/assistant/providers";
import type { ChatMessage } from "@/lib/assistant/providers/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let userId = "";

  try {
    // 1. Authorize user — accessible to ALL roles (Admin, Accountant, Auditor)
    // Note: write=false, admin=false to ensure Auditor can use chat guide
    const user = await authorize(request);
    userId = user.id;

    // 2. Validate request body
    let bodyJson: unknown;
    try {
      bodyJson = await request.json();
    } catch {
      return NextResponse.json(
        { error: "صيغة الطلب غير صالحة" },
        { status: 400 },
      );
    }

    const parseResult = assistantChatRequestSchema.safeParse(bodyJson);
    if (!parseResult.success) {
      const firstError =
        parseResult.error.errors[0]?.message || "بيانات الطلب غير صحيحة";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { message, history, currentRoute, locale } = parseResult.data;

    // 3. Check rate limits & concurrent streaming lock
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.error },
        {
          status: rateCheck.status || 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds || 10),
          },
        },
      );
    }

    // Acquire concurrent stream lock
    if (!acquireStreamLock(userId)) {
      return NextResponse.json(
        { error: "لديك محادثة جارية بالفعل. يرجى الانتظار حتى اكتمال الرد." },
        { status: 429 },
      );
    }

    // Record request count for the rate limiter
    recordRequest(userId);

    // 4. Build context and system prompt
    const context = {
      userRole: user.role,
      locale,
      currentRoute,
    };

    const systemPrompt = buildSystemPrompt(context, message);

    // Prepare message history (last N plus current user message)
    const messages: ChatMessage[] = [
      ...history,
      { role: "user", content: message },
    ];

    // 5. Initialize provider
    const provider = getAssistantProvider();

    // 6. Create SSE ReadableStream
    const encoder = new TextEncoder();
    const abortSignal = request.signal;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = provider.streamChat({
            system: systemPrompt,
            messages,
            context,
            signal: abortSignal,
          });

          for await (const chunk of generator) {
            if (abortSignal.aborted) {
              break;
            }
            if (chunk) {
              const payload = JSON.stringify({ text: chunk });
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            }
          }

          // Send termination signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error ? err.message : "حدث خطأ أثناء معالجة الرد";
          try {
            const errorPayload = JSON.stringify({ error: errorMessage });
            controller.enqueue(encoder.encode(`data: ${errorPayload}\n\n`));
            controller.close();
          } catch {
            // Controller might already be closed
          }
        } finally {
          // ALWAYS release the concurrent stream lock
          releaseStreamLock(userId);
        }
      },
      cancel() {
        // Client disconnected early
        releaseStreamLock(userId);
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disables Nginx response buffering for SSE
      },
    });
  } catch (error: unknown) {
    if (userId) {
      releaseStreamLock(userId);
    }

    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    const message =
      error instanceof Error ? error.message : "خطأ غير متوقع في الخادم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
