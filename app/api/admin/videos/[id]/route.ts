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

    // 1. 標籤處理
    let cleanTags: string[] = video.tags || [];
    if (typeof tags === "string") {
      cleanTags = tags
        .split(/[,，\s]+/)
        .map((t) => t.trim().replace(/^#/, ""))
        .filter((t) => t.length > 0);
    } else if (Array.isArray(tags)) {
      cleanTags = tags
        .map((t) => (typeof t === "string" ? t.trim().replace(/^#/, "") : ""))
        .filter((t) => t.length > 0);
    }
    cleanTags = Array.from(new Set(cleanTags));

    // 2. 拍攝日期安全解析 (避免空值或非法格式觸發 Invalid Date 崩潰)
    let parsedShootingDate: Date | null = video.shootingDate ?? null;
    if (shootingDate === null || shootingDate === "" || shootingDate === undefined) {
      parsedShootingDate = null;
    } else if (typeof shootingDate === "string") {
      const d = new Date(shootingDate);
      parsedShootingDate = isNaN(d.getTime()) ? null : d;
    }

    // 3. 分組陣列安全清洗
    const cleanGroupIds = Array.isArray(groupIds)
      ? groupIds.filter((gid) => typeof gid === "string" && gid.trim().length > 0)
      : video.groupIds;

    const updated = await prisma.video.update({
      where: { id },
      data: {
        title: typeof title === "string" && title.trim().length > 0 ? title.trim() : video.title,
        shootingDate: parsedShootingDate,
        groupIds: cleanGroupIds,
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
