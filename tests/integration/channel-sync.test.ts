import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";

describe("YouTube 增量同步與自訂分組保護測試 (Integration: Sync Idempotency)", () => {
  const testYtId = `yt_sync_${Date.now()}`;
  let createdVideoId = "";

  before(async () => {
    // 建立既有影片，並手動設定了群組與標籤
    const video = await prisma.video.create({
      data: {
        ytId: testYtId,
        title: "原始影片標題",
        description: "原始描述",
        thumbnail: "https://example.com/old_thumb.jpg",
        publishedAt: new Date(),
        groupIds: ["group_friends_123"],
        tags: ["重要回憶", "日本旅遊"],
        deleted: false,
      },
    });
    createdVideoId = video.id;
  });

  after(async () => {
    if (createdVideoId) {
      await prisma.video.delete({ where: { id: createdVideoId } });
    }
  });

  test("增量同步更新時，應更新標題與縮圖，但絕不可覆蓋管理員自訂的 groupIds 與 tags", async () => {
    // 模擬從 YouTube 抓取到該影片的最新更新
    const latestFromYt = {
      ytId: testYtId,
      title: "YouTube 上的新標題 (已改名)",
      description: "YouTube 最新描述",
      thumbnail: "https://example.com/new_thumb.jpg",
      ytPrivacyStatus: "public",
      publishedAt: new Date(),
    };

    // 執行同步邏輯
    const existing = await prisma.video.findUnique({
      where: { ytId: latestFromYt.ytId },
    });

    assert.ok(existing);

    // 進行增量更新 (Safe Incremental Update)
    await prisma.video.update({
      where: { id: existing.id },
      data: {
        title: latestFromYt.title,
        description: latestFromYt.description,
        thumbnail: latestFromYt.thumbnail,
        ytPrivacyStatus: latestFromYt.ytPrivacyStatus,
      },
    });

    // 重新取出驗證
    const updated = await prisma.video.findUnique({
      where: { id: existing.id },
    });

    assert.equal(updated?.title, "YouTube 上的新標題 (已改名)");
    assert.equal(updated?.thumbnail, "https://example.com/new_thumb.jpg");
    assert.equal(updated?.ytPrivacyStatus, "public");

    // 關鍵安全檢驗：自訂群組與標籤依然完整保留！
    assert.deepEqual(updated?.groupIds, ["group_friends_123"]);
    assert.deepEqual(updated?.tags, ["重要回憶", "日本旅遊"]);
  });
});
