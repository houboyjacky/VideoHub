import { prisma } from "@/lib/prisma";
import { parseUserAgent, extractClientIp } from "@/lib/user-agent";
import { headers } from "next/headers";

export interface LogEventParams {
  email: string;
  name?: string | null;
  image?: string | null;
  userId?: string | null;
  action: "login" | "logout" | "register" | "approve" | "reject" | string;
  status?: "success" | "failed" | string;
  details?: string | null;
  req?: Request | Headers | null;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * 自動修剪歷史活動日誌，嚴格恆定保留最新 50 筆
 */
export async function pruneActivityLogs(maxKeep: number = 50): Promise<void> {
  try {
    const totalCount = await prisma.activityLog.count();
    if (totalCount <= maxKeep) {
      return;
    }

    // 取得需要保留的最新 maxKeep 筆 ID
    const logsToKeep = await prisma.activityLog.findMany({
      select: { id: true },
      orderBy: { createdAt: "desc" },
      take: maxKeep,
    });

    const keepIds = logsToKeep.map((l) => l.id);

    // 刪除所有不在最新保留清單中的日誌記錄
    await prisma.activityLog.deleteMany({
      where: {
        id: { notIn: keepIds },
      },
    });
  } catch (err) {
    console.error("[PruneActivityLogs Error]:", err);
  }
}

/**
 * 安全非同步記錄系統活動日誌（絕不因日誌寫入異常而中斷使用者主要業務流程）
 * 並自動維持資料庫恆定保留最新 50 筆
 */
export async function recordActivityLog(params: LogEventParams): Promise<void> {
  try {
    let userAgentStr = params.userAgent || "";
    let clientIp = params.ip || "";

    // 嘗試從傳入的 Request/Headers 或 Next.js request headers 讀取
    if (!userAgentStr || !clientIp) {
      if (params.req) {
        if (params.req instanceof Headers) {
          if (!userAgentStr) userAgentStr = params.req.get("user-agent") || "";
          if (!clientIp) clientIp = extractClientIp(params.req);
        } else if ("headers" in params.req) {
          if (!userAgentStr) userAgentStr = params.req.headers.get("user-agent") || "";
          if (!clientIp) clientIp = extractClientIp(params.req);
        }
      } else {
        try {
          const reqHeaders = await headers();
          if (!userAgentStr) userAgentStr = reqHeaders.get("user-agent") || "";
          if (!clientIp) clientIp = extractClientIp(reqHeaders);
        } catch {
          // headers() may throw if outside request scope, safe to ignore
        }
      }
    }

    const { os, browser } = parseUserAgent(userAgentStr);

    await prisma.activityLog.create({
      data: {
        email: params.email.toLowerCase().trim(),
        name: params.name || null,
        image: params.image || null,
        userId: params.userId || null,
        action: params.action,
        status: params.status || "success",
        os,
        browser,
        ip: clientIp || "127.0.0.1",
        userAgent: userAgentStr.slice(0, 500),
        details: params.details || null,
        createdAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[RecordActivityLog Error]:", err);
  }
}
