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
 * 安全非同步記錄系統活動日誌（絕不因日誌寫入異常而中斷使用者主要業務流程）
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
