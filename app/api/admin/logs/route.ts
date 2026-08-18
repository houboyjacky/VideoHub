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

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { ip: { contains: search, mode: "insensitive" } },
        { os: { contains: search, mode: "insensitive" } },
        { browser: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
      ];
    }

    // 直接從資料庫撈取（若有搜尋條件直查全庫最多 500 筆，無搜尋時預設載入最新 50 筆）
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: search ? 500 : limit,
    });

    return NextResponse.json({
      success: true,
      logs,
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
