import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 200);
    const action = searchParams.get("action")?.trim().toLowerCase() || "";
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const where: any = {};
    if (action && action !== "all") {
      where.action = action;
    }

    // 取得最新日誌
    let logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200, // 先取多筆以便進行關鍵字篩選
    });

    // 關鍵字搜尋過濾 (支援姓名、Email、IP、作業系統 OS、瀏覽器、詳細說明)
    if (search) {
      logs = logs.filter((log) => {
        const text = [
          log.email,
          log.name || "",
          log.ip || "",
          log.os || "",
          log.browser || "",
          log.details || "",
          log.action,
        ]
          .join(" ")
          .toLowerCase();
        return text.includes(search);
      });
    }

    // 限制回傳指定筆數 (預設 50 筆)
    const resultLogs = logs.slice(0, limit);

    return NextResponse.json({
      success: true,
      logs: resultLogs,
      total: logs.length,
    });
  } catch (error) {
    console.error("[Admin Activity Logs GET Error]:", error);
    return NextResponse.json({ error: "讀取活動日誌失敗" }, { status: 500 });
  }
}

// DELETE: 禁止手動清空活動日誌（由系統自動恆定維護最新 50 筆）
export async function DELETE() {
  return NextResponse.json(
    {
      error: "系統活動日誌由系統自動恆定維護最新 50 筆，禁止手動清空以確保審計日誌之完整性與防篡改性。",
    },
    { status: 403 }
  );
}
