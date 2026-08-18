import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await context.params;

  try {
    const group = await prisma.group.findFirst({
      where: {
        OR: [{ shareId }, { id: shareId }],
      },
    });

    if (!group) {
      return NextResponse.json({ error: "找不到該分組展示頁" }, { status: 404 });
    }

    const [totalCount, videos] = await Promise.all([
      prisma.video.count({
        where: {
          groupIds: { has: group.id },
          deleted: false,
        },
      }),
      prisma.video.findMany({
        where: {
          groupIds: { has: group.id },
          deleted: false,
        },
        orderBy: [{ shootingDate: "desc" }, { publishedAt: "desc" }],
        take: 12,
      }),
    ]);

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        shareId: group.shareId,
      },
      totalCount,
      videos: videos.map((v) => ({
        id: v.id,
        title: v.title,
        thumbnail: v.thumbnail,
        publishedAt: v.publishedAt,
        shootingDate: v.shootingDate,
        tags: v.tags || [],
      })),
    });
  } catch (error) {
    console.error("[Share Group API Error]:", error);
    return NextResponse.json({ error: "伺服器內部錯誤" }, { status: 500 });
  }
}
