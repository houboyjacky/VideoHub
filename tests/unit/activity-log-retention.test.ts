import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";

describe("活動日誌永久全量保存與防清空機制測試 (Unit: Activity Log Permanent Retention & Anti-Wipe)", () => {
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

  test("多次寫入日誌應永久全量保存，不會自動被刪除或修剪", async () => {
    // 連續寫入 5 筆日誌
    for (let i = 1; i <= 5; i++) {
      await recordActivityLog({
        email: `${testPrefix}_${i}@example.com`,
        name: `歷史用戶 ${i}`,
        action: "login",
        status: "success",
        ip: `192.168.1.${i}`,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      });
    }

    // 檢查 5 筆日誌全部完整存在
    const count = await prisma.activityLog.count({
      where: { email: { startsWith: testPrefix } },
    });
    assert.equal(count, 5, "所有寫入的歷史日誌應 100% 完整保留");
  });

  test("recordActivityLog 寫入新日誌後能正確解析環境與操作詳情", async () => {
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
