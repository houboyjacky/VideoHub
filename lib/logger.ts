import fs from "fs";
import path from "path";

const LOGS_DIR = path.join(process.cwd(), "logs");

// 確保 logs 目錄存在
if (!fs.existsSync(LOGS_DIR)) {
  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  } catch {
    // 忽略建立失敗
  }
}

// 取得當前日期的 YYYY-MM-DD (台灣時區 UTC+8)
const getDateKey = (): string => {
  const now = new Date();
  const utcOffset = 8 * 60; // 台灣時區 +08:00
  const localDate = new Date(now.getTime() + (utcOffset + now.getTimezoneOffset()) * 60000);
  return localDate.toISOString().split("T")[0];
};

const getLogTimestamp = (): string => {
  const now = new Date();
  const utcOffset = 8 * 60;
  const local = new Date(now.getTime() + (utcOffset + now.getTimezoneOffset()) * 60000);
  return local.toISOString().replace("T", " ").replace("Z", "");
};

const formatMessage = (level: string, message: string, meta?: unknown): string => {
  let metaStr = "";
  if (meta !== undefined) {
    if (meta instanceof Error) {
      metaStr = ` | Error: ${meta.message}\nStack: ${meta.stack}`;
    } else if (typeof meta === "object") {
      try {
        metaStr = ` | ${JSON.stringify(meta)}`;
      } catch {
        metaStr = ` | [Unserializable Object]`;
      }
    } else {
      metaStr = ` | ${String(meta)}`;
    }
  }
  return `[${getLogTimestamp()}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
};

// 寫入當日 Rotate 檔案（永久保存）及主 log 檔
const appendToFile = (category: "app" | "auth" | "error", content: string) => {
  try {
    const dateKey = getDateKey();
    
    // 1. 每日 Rotate 檔案 (例如: app-2026-08-17.log 永遠保存)
    const dailyFile = path.join(LOGS_DIR, `${category}-${dateKey}.log`);
    fs.appendFileSync(dailyFile, content, "utf8");

    // 2. 當前通用日誌 (例如: app.log，供即時 tail -f 查看)
    const latestFile = path.join(LOGS_DIR, `${category}.log`);
    fs.appendFileSync(latestFile, content, "utf8");
  } catch (err) {
    console.error("[Logger File Write Error]:", err);
  }
};

export const logger = {
  info(message: string, meta?: unknown) {
    const logLine = formatMessage("INFO", message, meta);
    console.log(`[INFO] ${message}`, meta ?? "");
    appendToFile("app", logLine);
  },

  warn(message: string, meta?: unknown) {
    const logLine = formatMessage("WARN", message, meta);
    console.warn(`[WARN] ${message}`, meta ?? "");
    appendToFile("app", logLine);
  },

  error(message: string, meta?: unknown) {
    const logLine = formatMessage("ERROR", message, meta);
    console.error(`[ERROR] ${message}`, meta ?? "");
    appendToFile("app", logLine);
    appendToFile("error", logLine);
  },

  auth(message: string, meta?: unknown) {
    const logLine = formatMessage("AUTH", message, meta);
    console.log(`[AUTH] ${message}`, meta ?? "");
    appendToFile("auth", logLine);
    appendToFile("app", logLine);
  },
};

export default logger;
