import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { syncChannelVideos, getSyncMeta } from "@/lib/sync-channel";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) return authCheck.response;

  try {
    const meta = await getSyncMeta();
    const targetConfig = await prisma.systemConfig.findUnique({
      where: { key: "youtube_sync_target" },
    });

    const currentTarget =
      targetConfig?.value?.target ||
      process.env.YOUTUBE_CHANNEL_ID ||
      process.env.YOUTUBE_PLAYLIST_ID ||
      "";

    return NextResponse.json({
      meta,
      target: currentTarget,
      channelTitle: targetConfig?.value?.channelTitle || meta?.channelTitle || "",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "獲取同步狀態失敗" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) return authCheck.response;

  try {
    let customTarget: string | undefined = undefined;
    try {
      const body = await req.json();
      if (body && typeof body.target === "string" && body.target.trim().length > 0) {
        customTarget = body.target.trim();
      }
    } catch {
      // 無 request body 時使用預設設定
    }

    const accessToken = (authCheck.session as any)?.accessToken;
    const result = await syncChannelVideos(customTarget, accessToken);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `同步成功！頻道「${result.channelTitle}」共有 ${result.totalFound} 部影片 (新增 ${result.newCount} 部，更新 ${result.updatedCount} 部)`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "執行同步時發生錯誤" },
      { status: 500 }
    );
  }
}
