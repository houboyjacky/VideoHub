import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || user.status !== "approved") {
      return NextResponse.json({ error: "尚未授權存取" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const selectedGroupId = searchParams.get("groupId");
    const selectedTag = searchParams.get("tag");
    const query = searchParams.get("q")?.trim();

    const isAdmin = !!user.isAdmin;
    const userGroupIds = user.groupIds || [];

    // 1. 若非管理員且無任何分組，回傳空清單
    if (!isAdmin && userGroupIds.length === 0) {
      return NextResponse.json({
        videos: [],
        groups: [],
        tags: [],
      });
    }

    // 2. 決定分組篩選條件
    let targetGroupIds: string[] = [];
    if (isAdmin) {
      if (selectedGroupId) targetGroupIds = [selectedGroupId];
    } else {
      if (selectedGroupId) {
        // 確認該用戶擁有此分組權限
        if (userGroupIds.includes(selectedGroupId)) {
          targetGroupIds = [selectedGroupId];
        } else {
          return NextResponse.json({ error: "無權限存取該分組" }, { status: 403 });
        }
      } else {
        targetGroupIds = userGroupIds;
      }
    }

    // 3. 取得用戶可見的分組清單
    const visibleGroups = await prisma.group.findMany({
      where: isAdmin ? {} : { id: { in: userGroupIds } },
      orderBy: { name: "asc" },
    });
    const groupMap = new Map(visibleGroups.map((g) => [g.id, g.name]));

    // 4. 建立影片查詢條件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      deleted: false,
    };

    if (targetGroupIds.length > 0) {
      where.groupIds = { hasSome: targetGroupIds };
    }

    if (selectedTag) {
      where.tags = { has: selectedTag };
    }

    const allVideos = await prisma.video.findMany({
      where,
      orderBy: [
        { shootingDate: "desc" },
        { publishedAt: "desc" },
      ],
    });

    // 5. 記憶體搜尋過濾 (關鍵字 q)
    let filteredVideos = allVideos;
    if (query && query.length > 0) {
      const lowerQ = query.toLowerCase();
      filteredVideos = allVideos.filter((v) => {
        const inTitle = v.title.toLowerCase().includes(lowerQ);
        const inDesc = (v.description || "").toLowerCase().includes(lowerQ);
        const inTags = v.tags.some((t) => t.toLowerCase().includes(lowerQ));
        return inTitle || inDesc || inTags;
      });
    }

    // 6. 收集所有可用的 Tags
    const allTagsSet = new Set<string>();
    allVideos.forEach((v) => v.tags.forEach((t) => allTagsSet.add(t)));
    const allTags = Array.from(allTagsSet).sort();

    const videosWithGroupNames = filteredVideos.map((v) => ({
      ...v,
      groupNames: v.groupIds
        .map((gid) => groupMap.get(gid))
        .filter(Boolean) as string[],
    }));

    return NextResponse.json({
      videos: videosWithGroupNames,
      groups: visibleGroups,
      tags: allTags,
    });
  } catch (error) {
    console.error("[Videos GET API Error]:", error);
    return NextResponse.json({ error: "取得影片清單失敗" }, { status: 500 });
  }
}
