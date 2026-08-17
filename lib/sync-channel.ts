import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  fetchMyChannelUploadsInfo,
  fetchAllVideosFromPlaylist,
  fetchMyPrivateVideos,
} from "@/lib/youtube";

export interface SyncChannelResult {
  success: boolean;
  channelTitle: string;
  channelId: string;
  totalFound: number;
  newCount: number;
  updatedCount: number;
  lastSyncAt: string;
  error?: string;
}

export async function getSyncMeta() {
  const meta = await prisma.systemConfig.findUnique({
    where: { key: "youtube_sync_meta" },
  });
  return meta?.value || null;
}

export async function syncChannelVideos(
  customTarget?: string,
  accessToken?: string
): Promise<SyncChannelResult> {
  const startTime = new Date();
  logger.info("[YouTube Sync] 開始執行全頻道/播放清單同步...");

  // 1. 決定目標頻道或播放清單
  let target = customTarget?.trim();

  if (!target) {
    const savedConfig = await prisma.systemConfig.findUnique({
      where: { key: "youtube_sync_target" },
    });
    if (savedConfig?.value?.target) {
      target = savedConfig.value.target;
    }
  }

  if (!target) {
    target =
      process.env.YOUTUBE_CHANNEL_ID ||
      process.env.YOUTUBE_PLAYLIST_ID ||
      "";
  }

  try {
    // 2. 獲取頻道上傳播放清單資訊（若有 OAuth Access Token 且未指定 target，自動使用 mine: true 抓取登入者自己的頻道）
    const { uploadsPlaylistId, channelTitle, channelId } =
      await fetchMyChannelUploadsInfo(accessToken, target);

    logger.info(
      `[YouTube Sync] 成功識別頻道:「${channelTitle}」(${channelId})，上傳清單 ID: ${uploadsPlaylistId}`
    );

    // 儲存 target 設定以供日後定時排程使用
    const savedTargetValue = target || channelId || `@${channelTitle}`;
    const existingTarget = await prisma.systemConfig.findUnique({
      where: { key: "youtube_sync_target" },
    });
    if (existingTarget) {
      await prisma.systemConfig.update({
        where: { id: existingTarget.id },
        data: { value: { target: savedTargetValue, channelTitle, channelId } },
      });
    } else {
      await prisma.systemConfig.create({
        data: {
          key: "youtube_sync_target",
          value: { target: savedTargetValue, channelTitle, channelId },
        },
      });
    }

    // 3. 抓取該播放清單的所有影片 (公開與不公開)
    const ytVideos = await fetchAllVideosFromPlaylist(uploadsPlaylistId, 1000, accessToken);

    // 3.1 若有 OAuth Access Token，額外調用 forMine 檢索並合併未列入 Uploads 清單的私人影片
    if (accessToken) {
      const existingIds = new Set(ytVideos.map((v) => v.ytId));
      const privateVideos = await fetchMyPrivateVideos(accessToken, existingIds);
      if (privateVideos.length > 0) {
        logger.info(`[YouTube Sync] 透過 OAuth forMine 額外識別到 ${privateVideos.length} 部私人影片，合併同步...`);
        ytVideos.push(...privateVideos);
      }
    }

    logger.info(`[YouTube Sync] 從 YouTube 獲取到共 ${ytVideos.length} 部影片 (含公開/不公開/私人)，開始資料庫增量同步...`);

    let newCount = 0;
    let updatedCount = 0;

    for (const v of ytVideos) {
      const existing = await prisma.video.findUnique({
        where: { ytId: v.ytId },
      });

      if (existing) {
        // 已存在：僅更新元資料，保留管理員自訂的 groupIds 與 tags
        await prisma.video.update({
          where: { id: existing.id },
          data: {
            title:
              v.title && v.title !== "未命名影片" && v.title !== "Private video"
                ? v.title
                : (existing.title || v.title),
            description: v.description || existing.description,
            thumbnail: v.thumbnail || existing.thumbnail,
            ytPrivacyStatus: v.ytPrivacyStatus || existing.ytPrivacyStatus,
            publishedAt: v.publishedAt || existing.publishedAt,
            deleted: false,
          },
        });
        updatedCount++;
      } else {
        // 新影片：建立新記錄
        await prisma.video.create({
          data: {
            ytId: v.ytId,
            title: v.title,
            description: v.description,
            thumbnail: v.thumbnail,
            publishedAt: v.publishedAt,
            ytPrivacyStatus: v.ytPrivacyStatus,
            groupIds: [],
            tags: [],
            deleted: false,
          },
        });
        newCount++;
      }
    }

    const lastSyncAt = new Date().toISOString();
    const metaValue = {
      channelTitle,
      channelId,
      uploadsPlaylistId,
      totalFound: ytVideos.length,
      newCount,
      updatedCount,
      lastSyncAt,
      status: "success",
    };

    const existingMeta = await prisma.systemConfig.findUnique({
      where: { key: "youtube_sync_meta" },
    });
    if (existingMeta) {
      await prisma.systemConfig.update({
        where: { id: existingMeta.id },
        data: { value: metaValue },
      });
    } else {
      await prisma.systemConfig.create({
        data: {
          key: "youtube_sync_meta",
          value: metaValue,
        },
      });
    }

    logger.info(
      `[YouTube Sync] 同步完成！頻道「${channelTitle}」：共 ${ytVideos.length} 部（新增 ${newCount} 部，更新 ${updatedCount} 部）`
    );

    return {
      success: true,
      channelTitle,
      channelId,
      totalFound: ytVideos.length,
      newCount,
      updatedCount,
      lastSyncAt,
    };
  } catch (error: any) {
    const errorMsg = error?.message || "YouTube 頻道同步發生未知錯誤";
    logger.error(`[YouTube Sync Failed] ${errorMsg}`, error);

    return {
      success: false,
      channelTitle: "",
      channelId: "",
      totalFound: 0,
      newCount: 0,
      updatedCount: 0,
      lastSyncAt: startTime.toISOString(),
      error: errorMsg,
    };
  }
}
