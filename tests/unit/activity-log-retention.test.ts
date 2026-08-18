import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { recordActivityLog, pruneActivityLogs } from "@/lib/audit-log";

describe("活動日誌 50 筆自動保留與防清空機制測試 (Unit: Activity Log Retention & Anti-Wipe)", () => {
  const timestamp = Date.now();
  const testPrefix = `retention_test_${timestamp}`;

  before(async () => {
    // 預先清理測試前綴資料
    await prisma.activityLog.deleteMany({
      where: { email: { startsWith: "retention_test_" } },
    }).catch(() => {});
  });

  after(async () => {
    // 測試完成後自動清理
    await prisma.activityLog.deleteMany({
      where: { email: { startsWith: "retention_test_" } },
    }).catch(() => {});
  });

  test("當寫入多筆日誌時，pruneActivityLogs 應確保總筆數不超過 50 筆", async () => {
    // 寫入 55 筆測試記錄
    const createPromises = [];
    for (let i = 1; i <= 55; i++) {
      createPromises.push(
        prisma.activityLog.create({
          data: {
            email: `${testPrefix}_${i}@example.com`,
            name: `測試人員 ${i}`,
            action: "login",
            status: "success",
            os: "Linux",
            browser: "Chrome",
            ip: "127.0.0.1",
            createdAt: new Date(Date.now() + i * 1000), // 時間遞增
          },
        })
      );
    }
    await Promise.all(createPromises);

    // 執行修剪邏輯
    await pruneActivityLogs(50);

    // 檢查總日誌數量
    const count = await prisma.activityLog.count();
    assert.ok(count <= 50, `修剪後總筆數 (${count}) 應不大於 50 筆`);

    // 驗證保留的是最新的一筆 (第 55 筆應存在)
    const latestLog = await prisma.activityLog.findFirst({
      orderBy: { createdAt: "desc" },
    });
    assert.ok(latestLog !== null);
    assert.equal(latestLog?.email, `${testPrefix}_55@example.com`);
  });

  test("recordActivityLog 寫入新日誌後應自動觸發修剪至最多 50 筆", async () => {
    await recordActivityLog({
      email: `${testPrefix}_56@example.com`,
      name: "最新登入者",
      action: "login",
      status: "success",
      ip: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });

    const count = await prisma.activityLog.count();
    assert.ok(count <= 50, `寫入後自動修剪筆數 (${count}) 應維持在 50 筆以內`);
  });
});
