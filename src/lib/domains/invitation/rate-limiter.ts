// Rate limiting 狀態儲存 (記憶體級別)
export interface RateLimitRecord {
  attempts: number;
  lockedUntil: number | null; // Timestamp (ms)
  lastAttempt: number;        // Timestamp (ms)
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 分鐘
  WINDOW_MS: 10 * 60 * 1000,          // 10 分鐘滑動窗口
};

export const DEFAULT_MAX_FAILED_ATTEMPTS = RATE_LIMIT_CONFIG.MAX_ATTEMPTS;
export const DEFAULT_LOCKOUT_DURATION_MS = RATE_LIMIT_CONFIG.LOCKOUT_DURATION_MS;
export const ATTEMPT_WINDOW_MS = RATE_LIMIT_CONFIG.WINDOW_MS;

/**
 * 檢查給定的識別標識（IP 或 Session Email）是否已被鎖定
 */
export function checkInviteRateLimit(
  identifier: string,
  maxAttempts: number = DEFAULT_MAX_FAILED_ATTEMPTS,
  lockoutDurationMs: number = DEFAULT_LOCKOUT_DURATION_MS
): {
  isLocked: boolean;
  locked: boolean;
  remainingSeconds: number;
  attempts: number;
  attemptsLeft: number;
  maxAttempts: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    return {
      isLocked: false,
      locked: false,
      remainingSeconds: 0,
      attempts: 0,
      attemptsLeft: maxAttempts,
      maxAttempts,
    };
  }

  // 1. 檢查是否在鎖定期間內
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      isLocked: true,
      locked: true,
      remainingSeconds,
      attempts: record.attempts,
      attemptsLeft: 0,
      maxAttempts,
    };
  }

  // 2. 若鎖定已過期，自動重置
  if (record.lockedUntil && record.lockedUntil <= now) {
    rateLimitStore.delete(identifier);
    return {
      isLocked: false,
      locked: false,
      remainingSeconds: 0,
      attempts: 0,
      attemptsLeft: maxAttempts,
      maxAttempts,
    };
  }

  // 3. 檢查嘗試窗口是否已過期 (超過 10 分鐘未嘗試，次數歸零)
  if (now - record.lastAttempt > ATTEMPT_WINDOW_MS) {
    rateLimitStore.delete(identifier);
    return {
      isLocked: false,
      locked: false,
      remainingSeconds: 0,
      attempts: 0,
      attemptsLeft: maxAttempts,
      maxAttempts,
    };
  }

  const attemptsLeft = Math.max(0, maxAttempts - record.attempts);
  return {
    isLocked: false,
    locked: false,
    remainingSeconds: 0,
    attempts: record.attempts,
    attemptsLeft,
    maxAttempts,
  };
}

/**
 * 記錄一次邀請碼驗證失敗
 */
export function recordInviteFailure(
  identifier: string,
  maxAttempts: number = DEFAULT_MAX_FAILED_ATTEMPTS,
  lockoutDurationMs: number = DEFAULT_LOCKOUT_DURATION_MS
): {
  isLocked: boolean;
  locked: boolean;
  remainingSeconds: number;
  attempts: number;
  attemptsLeft: number;
} {
  const now = Date.now();
  const current = checkInviteRateLimit(identifier, maxAttempts, lockoutDurationMs);

  if (current.isLocked) {
    return {
      isLocked: true,
      locked: true,
      remainingSeconds: current.remainingSeconds,
      attempts: current.attempts,
      attemptsLeft: 0,
    };
  }

  const record = rateLimitStore.get(identifier) || {
    attempts: 0,
    lockedUntil: null,
    lastAttempt: now,
  };

  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= maxAttempts) {
    record.lockedUntil = now + lockoutDurationMs;
    rateLimitStore.set(identifier, record);
    return {
      isLocked: true,
      locked: true,
      remainingSeconds: Math.ceil(lockoutDurationMs / 1000),
      attempts: record.attempts,
      attemptsLeft: 0,
    };
  }

  rateLimitStore.set(identifier, record);
  return {
    isLocked: false,
    locked: false,
    remainingSeconds: 0,
    attempts: record.attempts,
    attemptsLeft: Math.max(0, maxAttempts - record.attempts),
  };
}

/**
 * 成功驗證邀請碼後重置失敗次數與鎖定
 */
export function resetInviteRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * 測試專用：清理全部限流記錄
 */
export function _clearAllInviteRateLimits(): void {
  rateLimitStore.clear();
}
