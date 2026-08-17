import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const body = await req.json();
    const { videoIds, groupIds, mode = "set" } = body;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json({ error: "請選擇至少一部影片" }, { status: 400 });
    }

    if (!Array.isArray(groupIds)) {
      return NextResponse.json({ error: "群組格式錯誤" }, { status: 400 });
    }

    if (mode === "add") {
      // 針對每部選取的影片將新群組合併加入（去重複）
      const videos = await prisma.video.findMany({
        where: { id: { in: videoIds } },
        select: { id: true, groupIds: true },
      });

      await Promise.all(
        videos.map((v) => {
          const currentGroups = Array.isArray(v.groupIds) ? v.groupIds : [];
          const merged = Array.from(new Set([...currentGroups, ...groupIds]));
          return prisma.video.update({
            where: { id: v.id },
            data: { groupIds: merged },
          });
        })
      );
    } else if (mode === "remove") {
      // 自選取影片中移除指定的群組
      const videos = await prisma.video.findMany({
        where: { id: { in: videoIds } },
        select: { id: true, groupIds: true },
      });

      await Promise.all(
        videos.map((v) => {
          const currentGroups = Array.isArray(v.groupIds) ? v.groupIds : [];
          const filtered = currentGroups.filter((gid) => !groupIds.includes(gid));
          return prisma.video.update({
            where: { id: v.id },
            data: { groupIds: filtered },
          });
        })
      );
    } else {
      // 預設模式 'set'：直接將選取影片的分組設定為指定的 groupIds
      await prisma.video.updateMany({
        where: { id: { in: videoIds } },
        data: {
          groupIds,
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: videoIds.length,
      message: `已成功為 ${videoIds.length} 部影片更新分組設定`,
    });
  } catch (error) {
    console.error("[Batch Video Groups Update Error]:", error);
    return NextResponse.json({ error: "批次更新影片分組失敗" }, { status: 500 });
  }
}
