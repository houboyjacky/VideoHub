import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";

describe("MongoDB 資料存取層與語法轉換單元測試 (Unit: Prisma Layer)", () => {
  const testGroupName = `TestGroup_${Date.now()}`;
  let createdGroupId: string = "";

  test("建立群組記錄 (create) 應自動產生 id 與 timestamps", async () => {
    const created = await prisma.group.create({
      data: {
        name: testGroupName,
        description: "測試群組描述",
      },
    });

    assert.ok(created.id, "應產生唯一的 MongoDB id");
    assert.equal(created.name, testGroupName);
    assert.ok(created.createdAt instanceof Date);
    assert.ok(created.updatedAt instanceof Date);

    createdGroupId = created.id;
  });

  test("依 id 查詢 (findUnique) 應正確轉換 ObjectId 並查出記錄", async () => {
    const found = await prisma.group.findUnique({
      where: { id: createdGroupId },
    });

    assert.ok(found);
    assert.equal(found?.id, createdGroupId);
    assert.equal(found?.name, testGroupName);
  });

  test("更新記錄 (update) 應正確更新欄位與 updatedAt", async () => {
    const updated = await prisma.group.update({
      where: { id: createdGroupId },
      data: {
        description: "已更新的測試描述",
      },
    });

    assert.equal(updated.description, "已更新的測試描述");
  });

  test("多重條件查詢 (findMany with in, has, hasSome) 語法驗證", async () => {
    // 建立臨時影片測試 has 查詢
    const testVideo = await prisma.video.create({
      data: {
        ytId: `test_yt_${Date.now()}`,
        title: "TDD 測試影片",
        thumbnail: "https://example.com/thumb.jpg",
        publishedAt: new Date(),
        groupIds: [createdGroupId],
        tags: ["tdd_tag_1", "tdd_tag_2"],
        deleted: false,
      },
    });

    // 1. 測試 has (陣列單一包含)
    const hasGroup = await prisma.video.findMany({
      where: { groupIds: { has: createdGroupId } },
    });
    assert.ok(hasGroup.some((v) => v.id === testVideo.id));

    // 2. 測試 hasSome (陣列多重交集)
    const hasSomeGroups = await prisma.video.findMany({
      where: { groupIds: { hasSome: [createdGroupId, "non_existent_id"] } },
    });
    assert.ok(hasSomeGroups.some((v) => v.id === testVideo.id));

    // 3. 測試 $pull 原子操作 (自陣列中移除元素)
    await prisma.video.updateMany({
      where: { id: testVideo.id },
      $pull: { groupIds: createdGroupId },
    });

    const afterPull = await prisma.video.findUnique({
      where: { id: testVideo.id },
    });
    assert.equal(afterPull?.groupIds.includes(createdGroupId), false);

    // 清理臨時影片
    await prisma.video.delete({ where: { id: testVideo.id } });
  });

  test("刪除記錄 (delete) 應成功自資料庫移除", async () => {
    const deleted = await prisma.group.delete({
      where: { id: createdGroupId },
    });

    assert.equal(deleted?.id, createdGroupId);

    const recheck = await prisma.group.findUnique({
      where: { id: createdGroupId },
    });
    assert.equal(recheck, null, "刪除後應無法再查出該記錄");
  });
});
