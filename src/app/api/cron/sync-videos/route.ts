import { NextResponse } from "next/server";
import { syncAllVideos } from "@/lib/sync-videos";
import { syncChannelVideos } from "@/lib/sync-channel";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "未授權的排程請求" }, { status: 401 });
    }

    // 1. 同步全頻道最新上架影片
    const channelResult = await syncChannelVideos();

    // 2. 更新既有影片狀態（標題變更、下架偵測）
    const videosResult = await syncAllVideos();

    return NextResponse.json({
      success: true,
      channelResult,
      videosResult,
    });
  } catch (error) {
    console.error("[Cron Sync Videos Error]:", error);
    return NextResponse.json({ error: "影片同步執行失敗" }, { status: 500 });
  }
}
