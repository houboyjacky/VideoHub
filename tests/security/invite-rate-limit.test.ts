import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import {
  checkInviteRateLimit,
  recordInviteFailure,
  resetInviteRateLimit,
} from "@/lib/rate-limiter";

describe("邀請碼防暴力猜測日誌與安全防禦測試 (Security: Invite Rate Limit & Audit Logs)", () => {
  const timestamp = Date.now();
  const testEmail = `sec_rate_limit_${timestamp}@example.com`;
  const testIp = `198.51.100.${timestamp % 200}`;

  before(async () => {
    resetInviteRateLimit(testEmail);
    resetInviteRateLimit(testIp);
  });

  after(async () => {
    resetInviteRateLimit(testEmail);
    resetInviteRateLimit(testIp);
    // 精確清理本安全測試專屬日誌
    await prisma.activityLog.deleteMany({
      where: { email: testEmail },
    }).catch(() => {});
  });

  test("連續輸錯 4 次時應處於未鎖定狀態且日誌記錄失敗事件", async () => {
    for (let i = 1; i <= 4; i++) {
      const res = recordInviteFailure(testEmail);
      assert.equal(res.locked, false);

      // 模擬寫入日誌
      await prisma.activityLog.create({
        data: {
          email: testEmail,
          name: "安全測試員",
          action: "invite_code_failed",
          status: "failed",
          ip: testIp,
          details: `輸入錯誤邀請碼「WRONG_${i}」 (剩餘 ${res.attemptsLeft} 次機會)`,
          createdAt: new Date(),
        },
      });
    }

    const logCount = await prisma.activityLog.count({
      where: { email: testEmail, action: "invite_code_failed" },
    });
    assert.equal(logCount, 4, "應精確記錄 4 次失敗審計日誌");
  });

  test("第 5 次錯誤時觸發 15 分鐘鎖定並寫入 lockout 日誌", async () => {
    const res = recordInviteFailure(testEmail);
    assert.equal(res.locked, true, "第 5 次應立即觸發鎖定");

    // 寫入鎖定日誌
    await prisma.activityLog.create({
      data: {
        email: testEmail,
        name: "安全測試員",
        action: "invite_rate_limit_lockout",
        status: "failed",
        ip: testIp,
        details: `連續輸入錯誤邀請碼達 5 次，觸發 15 分鐘安全冷卻鎖定`,
        createdAt: new Date(),
      },
    });

    const lockoutLog = await prisma.activityLog.findFirst({
      where: { email: testEmail, action: "invite_rate_limit_lockout" },
    });
    assert.ok(lockoutLog !== null, "應記錄 lockout 安全審計日誌");
    assert.match(lockoutLog?.details || "", /15 分鐘安全冷卻鎖定/);
  });

  test("處於鎖定期間再次嘗試應被攔截並寫入 blocked 日誌", async () => {
    const limitStatus = checkInviteRateLimit(testEmail);
    assert.equal(limitStatus.locked, true);

    await prisma.activityLog.create({
      data: {
        email: testEmail,
        name: "安全測試員",
        action: "invite_rate_limit_blocked",
        status: "failed",
        ip: testIp,
        details: `帳號處於安全冷卻期內，系統拒絕請求 (剩餘鎖定時間: ${limitStatus.remainingSeconds} 秒)`,
        createdAt: new Date(),
      },
    });

    const blockedLog = await prisma.activityLog.findFirst({
      where: { email: testEmail, action: "invite_rate_limit_blocked" },
    });
    assert.ok(blockedLog !== null);
    assert.match(blockedLog?.details || "", /剩餘鎖定時間/);
  });
});
