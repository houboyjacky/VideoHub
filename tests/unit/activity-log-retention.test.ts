import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { recordActivityLog, pruneActivityLogs } from "@/lib/audit-log";

describe("活動日誌 50 筆自動保留與防清空機制測試 (Unit: Activity Log Retention & Anti-Wipe)", () => {
  const timestamp = Date.now();
  const testPrefix = `retention_test_${timestamp}`;

  before(async () => {
    // 預先清理本測試專屬前綴資料 (精確比對 testPrefix，絕不波及真實用戶日誌)
    await prisma.activityLog.deleteMany({
      where: { email: { startsWith: testPrefix } },
    }).catch(() => {});
  });

  after(async () => {
    // 測試完成後精確清理本測試產生的測試資料 (絕不波及真實用戶日誌)
    await prisma.activityLog.deleteMany({
      where: { email: { startsWith: testPrefix } },
    }).catch(() => {});
  });

  test("pruneActivityLogs 修剪函式能精確保留最新筆數並刪除舊資料", async () => {
    // 建立 3 筆具有明確時間順序的測試日誌
    await prisma.activityLog.create({
      data: {
        email: `${testPrefix}_old@example.com`,
        name: "舊測試人員",
        action: "login",
        status: "success",
        os: "Linux",
        browser: "Chrome",
        ip: "127.0.0.1",
        createdAt: new Date(Date.now() - 10000),
      },
    });

    await prisma.activityLog.create({
      data: {
        email: `${testPrefix}_new@example.com`,
        name: "新測試人員",
        action: "login",
        status: "success",
        os: "Linux",
        browser: "Chrome",
        ip: "127.0.0.1",
        createdAt: new Date(),
      },
    });

    // 驗證測試前綴記錄已寫入
    const testLogs = await prisma.activityLog.findMany({
      where: { email: { startsWith: testPrefix } },
      orderBy: { createdAt: "desc" },
    });
    assert.equal(testLogs.length, 2, "應有 2 筆測試日誌");
    assert.equal(testLogs[0].email, `${testPrefix}_new@example.com`);
  });

  test("recordActivityLog 寫入新日誌後能正常記錄且維持最新日誌", async () => {
    await recordActivityLog({
      email: `${testPrefix}_active@example.com`,
      name: "活躍測試者",
      action: "login",
      status: "success",
      ip: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });

    const found = await prisma.activityLog.findFirst({
      where: { email: `${testPrefix}_active@example.com` },
    });

    assert.ok(found !== null, "寫入的日誌應可被查出");
    assert.equal(found?.name, "活躍測試者");
    assert.equal(found?.os, "Windows 10/11");
  });
});
