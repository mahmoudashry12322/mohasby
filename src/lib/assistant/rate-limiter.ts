/**
 * In-memory rate limiter and concurrency guard for the AI Assistant.
 *
 * Rules:
 *  - 10 messages / minute per user
 *  - 100 messages / day per user
 *  - System-wide daily total limit (ASSISTANT_DAILY_TOTAL_LIMIT env, default: 500)
 *  - Exactly ONE active streaming request per user at any time (concurrency lock)
 *
 * Designed for PM2 single-instance fork mode.
 * Can be reset for testing via resetRateLimiter().
 */

interface UserRateRecord {
  // Timestamps of requests in the current sliding minute window
  minuteTimestamps: number[];
  // Daily count and day start timestamp
  dayCount: number;
  dayStartTimestamp: number;
}

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const RATE_LIMITS = {
  USER_PER_MINUTE: 10,
  USER_PER_DAY: 100,
  DEFAULT_SYSTEM_DAILY: 500,
};

// State maps
const userRecords = new Map<string, UserRateRecord>();
const activeStreams = new Map<string, number>();

let systemDayCount = 0;
let systemDayStart = Date.now();

function getSystemDailyLimit(): number {
  const envVal = process.env.ASSISTANT_DAILY_TOTAL_LIMIT;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return RATE_LIMITS.DEFAULT_SYSTEM_DAILY;
}

function cleanExpiredMinuteTimestamps(record: UserRateRecord, now: number): void {
  const windowStart = now - MINUTE_MS;
  record.minuteTimestamps = record.minuteTimestamps.filter((ts) => ts > windowStart);
}

function checkAndResetDay(record: UserRateRecord, now: number): void {
  if (now - record.dayStartTimestamp >= DAY_MS) {
    record.dayCount = 0;
    record.dayStartTimestamp = now;
  }
}

function checkAndResetSystemDay(now: number): void {
  if (now - systemDayStart >= DAY_MS) {
    systemDayCount = 0;
    systemDayStart = now;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  status?: number;
  error?: string;
  retryAfterSeconds?: number;
}

/**
 * Checks all rate limits for a given user before initiating a stream.
 */
export function checkRateLimit(userId: string, now = Date.now()): RateLimitResult {
  // 1. Concurrent stream check with 45-second auto-expiry
  const streamLockedAt = activeStreams.get(userId);
  if (streamLockedAt) {
    if (now - streamLockedAt < 45000) {
      return {
        allowed: false,
        status: 429,
        error: "لديك محادثة جارية بالفعل. يرجى الانتظار حتى اكتمال الرد السابق.",
        retryAfterSeconds: 5,
      };
    }
    // Expired lock: auto-release
    activeStreams.delete(userId);
  }

  // 2. System-wide daily limit check
  checkAndResetSystemDay(now);
  const systemLimit = getSystemDailyLimit();
  if (systemDayCount >= systemLimit) {
    return {
      allowed: false,
      status: 429,
      error: "تم الوصول إلى الحد الأقصى اليومي لطلبات المساعد الذكي على مستوى النظام.",
      retryAfterSeconds: Math.ceil((systemDayStart + DAY_MS - now) / 1000),
    };
  }

  // 3. User limits
  let record = userRecords.get(userId);
  if (!record) {
    record = {
      minuteTimestamps: [],
      dayCount: 0,
      dayStartTimestamp: now,
    };
    userRecords.set(userId, record);
  }

  // User daily check
  checkAndResetDay(record, now);
  if (record.dayCount >= RATE_LIMITS.USER_PER_DAY) {
    const retryAfter = Math.ceil((record.dayStartTimestamp + DAY_MS - now) / 1000);
    return {
      allowed: false,
      status: 429,
      error: `تم الوصول إلى الحد اليومي المسموح به (${RATE_LIMITS.USER_PER_DAY} رسالة في اليوم).`,
      retryAfterSeconds: Math.max(1, retryAfter),
    };
  }

  // User minute check
  cleanExpiredMinuteTimestamps(record, now);
  if (record.minuteTimestamps.length >= RATE_LIMITS.USER_PER_MINUTE) {
    const oldest = record.minuteTimestamps[0];
    const retryAfter = Math.ceil((oldest + MINUTE_MS - now) / 1000);
    return {
      allowed: false,
      status: 429,
      error: `تم تجاوز معدل الإرسال (${RATE_LIMITS.USER_PER_MINUTE} رسايل في الدقيقة). انتظر قليلاً.`,
      retryAfterSeconds: Math.max(1, retryAfter),
    };
  }

  return { allowed: true };
}

/**
 * Records that a request was consumed by userId.
 */
export function recordRequest(userId: string, now = Date.now()): void {
  checkAndResetSystemDay(now);
  systemDayCount++;

  let record = userRecords.get(userId);
  if (!record) {
    record = {
      minuteTimestamps: [],
      dayCount: 0,
      dayStartTimestamp: now,
    };
    userRecords.set(userId, record);
  }

  cleanExpiredMinuteTimestamps(record, now);
  checkAndResetDay(record, now);

  record.minuteTimestamps.push(now);
  record.dayCount++;
}

/**
 * Acquires a concurrent stream lock for userId.
 * Returns true if locked successfully, false if already locked.
 */
export function acquireStreamLock(userId: string, now = Date.now()): boolean {
  const lockedAt = activeStreams.get(userId);
  if (lockedAt && now - lockedAt < 45000) {
    return false;
  }
  activeStreams.set(userId, now);
  return true;
}

/**
 * Releases the stream lock for userId.
 */
export function releaseStreamLock(userId: string): void {
  activeStreams.delete(userId);
}

/**
 * Resets all rate limit state — useful for unit tests.
 */
export function resetRateLimiter(): void {
  userRecords.clear();
  activeStreams.clear();
  systemDayCount = 0;
  systemDayStart = Date.now();
}

/**
 * Returns current stats for testing or observability.
 */
export function getRateLimiterStats() {
  return {
    trackedUsers: userRecords.size,
    activeStreamsCount: activeStreams.size,
    systemDayCount,
    systemDailyLimit: getSystemDailyLimit(),
  };
}
