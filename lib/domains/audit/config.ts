export interface AuditConfig {
  logLevel: "debug" | "info" | "warn" | "error";
  logDir: string;
  activityLogPageSize: number;
  activityLogSearchLimit: number;
  rateLimitMaxAttempts: number;
  rateLimitLockoutMinutes: number;
}

/**
 * 領域規則：型別安全讀取日誌與審計設定，提供健全預設值
 */
export function getAuditConfig(): AuditConfig {
  const rawLevel = (process.env.LOG_LEVEL || "info").toLowerCase();
  const validLevels: Array<AuditConfig["logLevel"]> = ["debug", "info", "warn", "error"];
  const logLevel = validLevels.includes(rawLevel as AuditConfig["logLevel"])
    ? (rawLevel as AuditConfig["logLevel"])
    : "info";

  const logDir = process.env.LOG_DIR || "./logs";

  const activityLogPageSize = Math.max(
    1,
    parseInt(process.env.ACTIVITY_LOG_PAGE_SIZE || "50", 10) || 50
  );

  const activityLogSearchLimit = Math.max(
    10,
    parseInt(process.env.ACTIVITY_LOG_SEARCH_LIMIT || "500", 10) || 500
  );

  const rateLimitMaxAttempts = Math.max(
    1,
    parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || "5", 10) || 5
  );

  const rateLimitLockoutMinutes = Math.max(
    1,
    parseInt(process.env.RATE_LIMIT_LOCKOUT_MINUTES || "15", 10) || 15
  );

  return {
    logLevel,
    logDir,
    activityLogPageSize,
    activityLogSearchLimit,
    rateLimitMaxAttempts,
    rateLimitLockoutMinutes,
  };
}
