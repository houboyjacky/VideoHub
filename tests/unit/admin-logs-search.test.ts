import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";

describe("後台活動日誌資料庫級別搜尋測試 (Unit: Admin Logs Database Search)", () => {
  const timestamp = Date.now();
  const targetEmail = `search_target_${timestamp}@example.com`;
  const otherEmail = `search_other_${timestamp}@example.com`;

  before(async () => {
    // 建立一筆特定關鍵字的測試日誌
    await prisma.activityLog.create({
      data: {
        email: targetEmail,
        name: "特種搜查人員",
        action: "login",
        status: "success",
        os: "Windows 11",
        browser: "Chrome",
        ip: "203.0.113.199",
        details: "從特殊地理位置登入測試",
        createdAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        email: otherEmail,
        name: "普通人員",
        action: "login",
        status: "success",
        os: "macOS",
        browser: "Safari",
        ip: "198.51.100.1",
        details: "日常存取",
        createdAt: new Date(),
      },
    });
  });

  after(async () => {
    // 測試完成後精確清理本測試產生的 2 筆日誌 (絕不誤刪真實用戶資料)
    await prisma.activityLog.deleteMany({
      where: {
        email: { in: [targetEmail, otherEmail] },
      },
    }).catch(() => {});
  });

  test("依 Email 關鍵字直接從資料庫搜尋", async () => {
    const results = await prisma.activityLog.findMany({
      where: {
        OR: [
          { email: { contains: "search_target", mode: "insensitive" } },
          { name: { contains: "search_target", mode: "insensitive" } },
          { details: { contains: "search_target", mode: "insensitive" } },
        ],
      },
    });

    assert.ok(results.length >= 1, "應從資料庫撈出包含 search_target 的日誌");
    assert.equal(results[0].email, targetEmail);
  });

  test("依 說明細節 (details) 關鍵字直接從資料庫搜尋", async () => {
    const results = await prisma.activityLog.findMany({
      where: {
        OR: [
          { details: { contains: "特殊地理位置", mode: "insensitive" } },
          { name: { contains: "特殊地理位置", mode: "insensitive" } },
        ],
      },
    });

    assert.ok(results.length >= 1, "應從資料庫撈出說明包含『特殊地理位置』的日誌");
    assert.equal(results[0].name, "特種搜查人員");
  });

  test("依 IP 關鍵字直接從資料庫搜尋", async () => {
    const results = await prisma.activityLog.findMany({
      where: {
        OR: [
          { ip: { contains: "203.0.113", mode: "insensitive" } },
        ],
      },
    });

    assert.ok(results.length >= 1, "應從資料庫撈出 IP 包含『203.0.113』的日誌");
    assert.equal(results[0].ip, "203.0.113.199");
  });
});
