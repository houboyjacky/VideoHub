import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { fetchVideoMetadata } from "@/lib/youtube";

// GET: 取得所有影片清單 (含軟刪除與統計)
export async function GET() {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const videos = await prisma.video.findMany({
      where: { deleted: false },
      orderBy: [
        { shootingDate: "desc" },
        { publishedAt: "desc" },
      ],
    });

    const groups = await prisma.group.findMany();
    const groupMap = new Map(groups.map((g) => [g.id, g.name]));

    const videosWithGroupNames = videos.map((v) => ({
      ...v,
      groupNames: v.groupIds.map((gid) => groupMap.get(gid) || "未知分組"),
    }));

    return NextResponse.json({ videos: videosWithGroupNames, groups });
  } catch (error) {
    console.error("[Admin Videos GET Error]:", error);
    return NextResponse.json({ error: "無法取得影片清單" }, { status: 500 });
  }
}

// POST: 新增影片 (支援傳入 YouTube 網址，自動抓取元資料)
export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const body = await req.json();
    const { url, shootingDate, groupIds, tags, customTitle } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "請輸入 YouTube 影片網址或 ID" }, { status: 400 });
    }

    // 1. 抓取 YouTube 元資料
    const metadata = await fetchVideoMetadata(url);

    // 2. 檢查資料庫是否已存在該影片
    const existing = await prisma.video.findUnique({
      where: { ytId: metadata.ytId },
    });

    if (existing && !existing.deleted) {
      return NextResponse.json({ error: `此影片已存在於系統中 (標題：${existing.title})` }, { status: 400 });
    }

    // 3. 處理標籤正規化
    let cleanTags: string[] = [];
    if (Array.isArray(tags)) {
      cleanTags = tags
        .map((t) => (typeof t === "string" ? t.trim().replace(/^#/, "") : ""))
        .filter((t) => t.length > 0);
    } else if (typeof tags === "string") {
      cleanTags = tags
        .split(/[,，\s]+/)
        .map((t) => t.trim().replace(/^#/, ""))
        .filter((t) => t.length > 0);
    }
    cleanTags = Array.from(new Set(cleanTags)); // 去重

    // 4. 建立或復原影片記錄
    let newVideo;
    if (existing) {
      newVideo = await prisma.video.update({
        where: { id: existing.id },
        data: {
          title: customTitle?.trim() || metadata.title,
          description: metadata.description,
          thumbnail: metadata.thumbnail,
          ytPrivacyStatus: metadata.ytPrivacyStatus,
          publishedAt: metadata.publishedAt,
          shootingDate: shootingDate ? new Date(shootingDate) : null,
          groupIds: Array.isArray(groupIds) ? groupIds : [],
          tags: cleanTags,
          deleted: false,
        },
      });
    } else {
      newVideo = await prisma.video.create({
        data: {
          ytId: metadata.ytId,
          title: customTitle?.trim() || metadata.title,
          description: metadata.description,
          thumbnail: metadata.thumbnail,
          ytPrivacyStatus: metadata.ytPrivacyStatus,
          publishedAt: metadata.publishedAt,
          shootingDate: shootingDate ? new Date(shootingDate) : null,
          groupIds: Array.isArray(groupIds) ? groupIds : [],
          tags: cleanTags,
          deleted: false,
        },
      });
    }

    return NextResponse.json({ success: true, video: newVideo });
  } catch (error: unknown) {
    console.error("[Admin Video POST Error]:", error);
    const msg = error instanceof Error ? error.message : "新增影片失敗";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
