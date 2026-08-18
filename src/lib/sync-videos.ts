import { prisma } from "@/lib/prisma";
import { fetchMultipleVideosMetadata } from "@/lib/youtube";

export async function syncAllVideos() {
  const videos = await prisma.video.findMany({
    where: { deleted: false },
    select: { id: true, ytId: true, title: true, ytPrivacyStatus: true },
  });

  if (videos.length === 0) {
    return { syncedCount: 0, updatedCount: 0, deletedCount: 0 };
  }

  const ytIds = videos.map((v) => v.ytId);
  const metadataMap = await fetchMultipleVideosMetadata(ytIds);

  let updatedCount = 0;
  let deletedCount = 0;

  for (const video of videos) {
    const meta = metadataMap.get(video.ytId);
    if (!meta) continue;

    if (meta.notFound) {
      // 只有非私人影片在 API Key 查無結果時才標記為 deleted (私人影片無法被純 API Key 查詢)
      if (video.ytPrivacyStatus !== "private") {
        await prisma.video.update({
          where: { id: video.id },
          data: { deleted: true },
        });
        deletedCount++;
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};
      if (meta.title) updateData.title = meta.title;
      if (meta.thumbnail) updateData.thumbnail = meta.thumbnail;
      if (meta.ytPrivacyStatus) updateData.ytPrivacyStatus = meta.ytPrivacyStatus;

      if (Object.keys(updateData).length > 0) {
        await prisma.video.update({
          where: { id: video.id },
          data: updateData,
        });
        updatedCount++;
      }
    }
  }

  return {
    totalChecked: videos.length,
    updatedCount,
    deletedCount,
  };
}
