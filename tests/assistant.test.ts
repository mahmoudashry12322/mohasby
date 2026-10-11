import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import {
  assistantChatRequestSchema,
  chatMessageSchema,
} from "../src/lib/assistant/validation";
import {
  checkRateLimit,
  recordRequest,
  acquireStreamLock,
  releaseStreamLock,
  resetRateLimiter,
  RATE_LIMITS,
} from "../src/lib/assistant/rate-limiter";
import {
  getAssistantProvider,
  MockProvider,
} from "../src/lib/assistant/providers";
import {
  loadAllArticles,
  getKnowledge,
  estimateTokens,
  clearArticleCache,
} from "../src/lib/assistant/knowledge-loader";
import { buildSystemPrompt } from "../src/lib/assistant/system-prompt";

beforeEach(() => {
  resetRateLimiter();
  clearArticleCache();
});

test("Validation: rejects empty messages and invalid roles", () => {
  // Empty message
  const emptyRes = assistantChatRequestSchema.safeParse({ message: "" });
  assert.equal(emptyRes.success, false);

  // Valid message
  const validRes = assistantChatRequestSchema.safeParse({
    message: "كيف أنشئ قيد يومية؟",
    locale: "ar",
  });
  assert.equal(validRes.success, true);
  if (validRes.success) {
    assert.equal(validRes.data.message, "كيف أنشئ قيد يومية؟");
    assert.equal(validRes.data.locale, "ar");
  }

  // Invalid message in history
  const invalidHistory = assistantChatRequestSchema.safeParse({
    message: "مرحبا",
    history: [{ role: "hacker", content: "test" }],
  });
  assert.equal(invalidHistory.success, false);
});

test("Validation: enforces max lengths", () => {
  const longMsg = "أ".repeat(2500);
  const res = assistantChatRequestSchema.safeParse({ message: longMsg });
  assert.equal(res.success, false);
});

test("Rate Limiter: enforces 10 messages per minute per user", () => {
  const userId = "user-123";
  const now = 1000000;

  // First 10 requests within same minute should be allowed
  for (let i = 0; i < 10; i++) {
    const check = checkRateLimit(userId, now + i * 1000);
    assert.equal(check.allowed, true, `Request ${i + 1} should be allowed`);
    recordRequest(userId, now + i * 1000);
  }

  // 11th request in the same minute should be rejected
  const rejectedCheck = checkRateLimit(userId, now + 11000);
  assert.equal(rejectedCheck.allowed, false);
  assert.equal(rejectedCheck.status, 429);
  assert.match(rejectedCheck.error || "", /معدل الإرسال/);

  // Moving forward by 65 seconds should allow requests again
  const laterCheck = checkRateLimit(userId, now + 65000);
  assert.equal(laterCheck.allowed, true);
});

test("Rate Limiter: enforces 100 messages per day per user", () => {
  const userId = "user-heavy";
  let now = 2000000;

  // Record 100 requests spread over the day (not hitting per-minute limit)
  for (let i = 0; i < 100; i++) {
    now += 70000; // 70s between requests -> resets minute window
    assert.equal(checkRateLimit(userId, now).allowed, true);
    recordRequest(userId, now);
  }

  // 101st request on the same day must be rejected
  const check101 = checkRateLimit(userId, now + 70000);
  assert.equal(check101.allowed, false);
  assert.equal(check101.status, 429);
  assert.match(check101.error || "", /الحد اليومي/);
});

test("Rate Limiter: enforces concurrency lock (single active stream)", () => {
  const userId = "user-concurrent";

  // Lock once
  const firstLock = acquireStreamLock(userId);
  assert.equal(firstLock, true);

  // Second lock attempt must fail
  const secondLock = acquireStreamLock(userId);
  assert.equal(secondLock, false);

  // checkRateLimit should also return false due to active stream
  const check = checkRateLimit(userId);
  assert.equal(check.allowed, false);
  assert.match(check.error || "", /جارية بالفعل/);

  // Release lock
  releaseStreamLock(userId);

  // Now lock can be acquired again
  assert.equal(acquireStreamLock(userId), true);
  releaseStreamLock(userId);
});

test("Rate Limiter: enforces system-wide daily total limit", () => {
  process.env.ASSISTANT_DAILY_TOTAL_LIMIT = "3";
  const now = 3000000;

  recordRequest("user-a", now);
  recordRequest("user-b", now + 1000);
  recordRequest("user-c", now + 2000);

  // 4th request from user-d should be rejected by system limit
  const check = checkRateLimit("user-d", now + 3000);
  assert.equal(check.allowed, false);
  assert.match(check.error || "", /الحد الأقصى اليومي لطلبات المساعد الذكي على مستوى النظام/);

  delete process.env.ASSISTANT_DAILY_TOTAL_LIMIT;
});

test("Provider Selection: returns MockProvider when configured", () => {
  const provider = getAssistantProvider("mock");
  assert.equal(provider.name, "mock");
});

test("MockProvider: streams responses in chunks", async () => {
  const mock = new MockProvider("مرحبا بكم في محاسبي");
  const abortController = new AbortController();

  const generator = mock.streamChat({
    system: "sys",
    messages: [{ role: "user", content: "hi" }],
    context: { userRole: "admin", locale: "ar", currentRoute: "/dashboard" },
    signal: abortController.signal,
  });

  const chunks: string[] = [];
  for await (const chunk of generator) {
    chunks.push(chunk);
  }

  const combined = chunks.join("");
  assert.match(combined, /مرحبا بكم في محاسبي/);
});

test("Knowledge Loader: loads all 12 articles and caches them", () => {
  const articles = loadAllArticles();
  assert.equal(articles.length >= 12, true, `Expected >= 12 articles, got ${articles.length}`);

  // Test caching: repeated call returns same array
  const cached = loadAllArticles();
  assert.equal(cached, articles);

  const keys = articles.map((a) => a.key);
  assert.ok(keys.includes("chart-of-accounts"));
  assert.ok(keys.includes("journal-entries"));
  assert.ok(keys.includes("inventory"));
  assert.ok(keys.includes("banks-cash-cheques"));
  assert.ok(keys.includes("financial-statements"));
  assert.ok(keys.includes("specialized-activities"));
});

test("Knowledge Loader: prioritizes articles based on current route and query", () => {
  const result = getKnowledge({
    currentRoute: "accounting/journal-entries",
    query: "كيف أسجل قيد متوازن؟",
    maxTokens: 2000,
  });

  assert.ok(result.loadedTopics.includes("journal-entries"));
  assert.ok(result.loadedTopics.includes("chart-of-accounts") || result.loadedTopics.includes("getting-started"));
  assert.ok(result.estimatedTokens <= 2500);
});

test("System Prompt: injects user role, boundaries, and route", () => {
  const prompt = buildSystemPrompt({
    userRole: "auditor",
    locale: "ar",
    currentRoute: "banking/cheque-portfolio",
  });

  assert.match(prompt, /auditor/i);
  assert.match(prompt, /مراجع \/ مدقق/);
  assert.match(prompt, /banking\/cheque-portfolio/);
  assert.match(prompt, /مرشد إرشادي فقط/);
  assert.match(prompt, /لا تنفذ عمليات/);
});
