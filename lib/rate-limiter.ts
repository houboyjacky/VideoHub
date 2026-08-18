/**
 * 邀請碼防暴力破解與安全冷卻鎖定模組 (Invite Code Rate Limiter & Lockout)
 * 支援對使用者 Session (Email) 與 Client IP 進行多維度安全綁定
 */

interface AttemptRecord {
  count: number;
  firstAttemptTime: number;
  lockedUntil: number | null;
}

const attemptStore = new Map<string, AttemptRecord>();

// 策略參數
export const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5, // 10 分鐘內最多允許輸錯 5 次
  WINDOW_MS: 10 * 60 * 1000, // 10 分鐘統計窗口
  LOCKOUT_MS: 15 * 60 * 1000, // 輸錯達上限鎖定 15 分鐘
};

/**
 * 檢查特定識別標識 (Session Email 或 IP) 是否已被鎖定
 */
export function checkInviteRateLimit(identifier: string): {
  locked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
} {
  const cleanKey = identifier.trim().toLowerCase();
  const now = Date.now();
  const record = attemptStore.get(cleanKey);

  if (!record) {
    return { locked: false, remainingSeconds: 0, attemptsLeft: RATE_LIMIT_CONFIG.MAX_ATTEMPTS };
  }

  // 1. 檢查是否處於鎖定狀態
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { locked: true, remainingSeconds, attemptsLeft: 0 };
  }

  // 2. 若鎖定已過期或時間窗口已過，自動重置
  if (
    (record.lockedUntil && record.lockedUntil <= now) ||
    now - record.firstAttemptTime > RATE_LIMIT_CONFIG.WINDOW_MS
  ) {
    attemptStore.delete(cleanKey);
    return { locked: false, remainingSeconds: 0, attemptsLeft: RATE_LIMIT_CONFIG.MAX_ATTEMPTS };
  }

  const attemptsLeft = Math.max(0, RATE_LIMIT_CONFIG.MAX_ATTEMPTS - record.count);
  return { locked: false, remainingSeconds: 0, attemptsLeft };
}

/**
 * 記錄一次輸入錯誤，達到上限時自動鎖定 15 分鐘
 */
export function recordInviteFailure(identifier: string): {
  locked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
} {
  const cleanKey = identifier.trim().toLowerCase();
  const now = Date.now();
  const record = attemptStore.get(cleanKey);

  if (!record || now - record.firstAttemptTime > RATE_LIMIT_CONFIG.WINDOW_MS) {
    attemptStore.set(cleanKey, {
      count: 1,
      firstAttemptTime: now,
      lockedUntil: null,
    });
    return {
      locked: false,
      remainingSeconds: 0,
      attemptsLeft: RATE_LIMIT_CONFIG.MAX_ATTEMPTS - 1,
    };
  }

  record.count += 1;

  if (record.count >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
    record.lockedUntil = now + RATE_LIMIT_CONFIG.LOCKOUT_MS;
    const remainingSeconds = Math.ceil(RATE_LIMIT_CONFIG.LOCKOUT_MS / 1000);
    return { locked: true, remainingSeconds, attemptsLeft: 0 };
  }

  const attemptsLeft = Math.max(0, RATE_LIMIT_CONFIG.MAX_ATTEMPTS - record.count);
  return { locked: false, remainingSeconds: 0, attemptsLeft };
}

/**
 * 成功兌換或加入後，立即重置失敗次數與鎖定狀態
 */
export function resetInviteRateLimit(identifier: string): void {
  const cleanKey = identifier.trim().toLowerCase();
  attemptStore.delete(cleanKey);
}

/**
 * 清除所有過期記錄 (記憶體回收維護)
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of attemptStore.entries()) {
    if (
      (!record.lockedUntil && now - record.firstAttemptTime > RATE_LIMIT_CONFIG.WINDOW_MS) ||
      (record.lockedUntil && record.lockedUntil <= now)
    ) {
      attemptStore.delete(key);
    }
  }
}
