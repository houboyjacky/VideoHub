import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { generateShareId } from "@/lib/share-id";

// GET: 取得所有分組清單
export async function GET() {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const groups = await prisma.group.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 同時統計各分組影片、用戶數量與前 3 張縮圖
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const [videoCount, userCount, topVideos] = await Promise.all([
          prisma.video.count({
            where: { groupIds: { has: group.id }, deleted: false },
          }),
          prisma.user.count({
            where: { groupIds: { has: group.id } },
          }),
          prisma.video.findMany({
            where: { groupIds: { has: group.id }, deleted: false },
            orderBy: [{ shootingDate: "desc" }, { publishedAt: "desc" }],
            take: 3,
          }),
        ]);

        return {
          ...group,
          shareId: group.shareId || group.id,
          videoCount,
          userCount,
          thumbnails: topVideos.map((v) => v.thumbnail).filter(Boolean),
        };
      })
    );

    return NextResponse.json({ groups: groupsWithStats });
  } catch (error) {
    console.error("[Admin Groups GET Error]:", error);
    return NextResponse.json({ error: "無法取得分組清單" }, { status: 500 });
  }
}

// POST: 建立新分組
export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "請輸入分組名稱" }, { status: 400 });
    }

    const cleanName = name.trim();

    const existing = await prisma.group.findUnique({
      where: { name: cleanName },
    });

    if (existing) {
      return NextResponse.json({ success: true, group: existing, existing: true });
    }

    const newGroup = await prisma.group.create({
      data: {
        name: cleanName,
        description: description?.trim() || null,
        shareId: generateShareId(),
      },
    });

    return NextResponse.json({ success: true, group: newGroup });
  } catch (error) {
    console.error("[Admin Groups POST Error]:", error);
    return NextResponse.json({ error: "建立分組失敗" }, { status: 500 });
  }
}
