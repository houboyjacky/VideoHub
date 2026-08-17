import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// PUT: 更新影片拍攝日期、分組歸屬與標籤
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { title, shootingDate, groupIds, tags } = body;

    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json({ error: "找不到該影片" }, { status: 404 });
    }

    let cleanTags = video.tags;
    if (Array.isArray(tags)) {
      cleanTags = tags
        .map((t) => (typeof t === "string" ? t.trim().replace(/^#/, "") : ""))
        .filter((t) => t.length > 0);
      cleanTags = Array.from(new Set(cleanTags));
    }

    const updated = await prisma.video.update({
      where: { id },
      data: {
        title: title?.trim() || video.title,
        shootingDate: shootingDate !== undefined ? (shootingDate ? new Date(shootingDate) : null) : video.shootingDate,
        groupIds: Array.isArray(groupIds) ? groupIds : video.groupIds,
        tags: cleanTags,
      },
    });

    return NextResponse.json({ success: true, video: updated });
  } catch (error) {
    console.error("[Admin Video PUT Error]:", error);
    return NextResponse.json({ error: "更新影片資料失敗" }, { status: 500 });
  }
}

// DELETE: 刪除影片
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const { id } = await params;

    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json({ error: "找不到該影片" }, { status: 404 });
    }

    await prisma.video.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Video DELETE Error]:", error);
    return NextResponse.json({ error: "刪除影片失敗" }, { status: 500 });
  }
}
