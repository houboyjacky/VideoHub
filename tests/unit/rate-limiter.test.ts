import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  checkInviteRateLimit,
  recordInviteFailure,
  resetInviteRateLimit,
  RATE_LIMIT_CONFIG,
} from "@/lib/rate-limiter";

describe("邀請碼防暴力破解與安全鎖定單元測試 (Unit: Invite Code Rate Limiter)", () => {
  const testSessionEmail = "rate_limit_tester@example.com";
  const testIp = "203.0.113.88";

  beforeEach(() => {
    resetInviteRateLimit(testSessionEmail);
    resetInviteRateLimit(testIp);
  });

  test("初始狀態下不應被鎖定且擁有最大允許次數", () => {
    const status = checkInviteRateLimit(testSessionEmail);
    assert.equal(status.locked, false);
    assert.equal(status.remainingSeconds, 0);
    assert.equal(status.attemptsLeft, RATE_LIMIT_CONFIG.MAX_ATTEMPTS);
  });

  test("連續輸入錯誤 1~4 次應遞減剩餘次數且不觸發鎖定", () => {
    for (let i = 1; i <= 4; i++) {
      const res = recordInviteFailure(testSessionEmail);
      assert.equal(res.locked, false);
      assert.equal(res.attemptsLeft, RATE_LIMIT_CONFIG.MAX_ATTEMPTS - i);
    }
  });

  test("連續輸入錯誤第 5 次時應立即觸發安全鎖定 15 分鐘", () => {
    for (let i = 1; i <= 4; i++) {
      recordInviteFailure(testSessionEmail);
    }

    // 第 5 次錯誤
    const res = recordInviteFailure(testSessionEmail);
    assert.equal(res.locked, true, "第 5 次輸錯應立即鎖定");
    assert.ok(res.remainingSeconds > 0, "應有剩餘鎖定秒數");
    assert.equal(res.attemptsLeft, 0);

    // 再次檢查應處於鎖定中
    const status = checkInviteRateLimit(testSessionEmail);
    assert.equal(status.locked, true);
    assert.ok(status.remainingSeconds > 800, "鎖定時間應約為 15 分鐘 (900秒)");
  });

  test("成功驗證重置後，錯誤計數應歸零並解除鎖定", () => {
    for (let i = 1; i <= 5; i++) {
      recordInviteFailure(testSessionEmail);
    }
    assert.equal(checkInviteRateLimit(testSessionEmail).locked, true);

    // 成功兌換執行 reset
    resetInviteRateLimit(testSessionEmail);

    const statusAfterReset = checkInviteRateLimit(testSessionEmail);
    assert.equal(statusAfterReset.locked, false);
    assert.equal(statusAfterReset.attemptsLeft, RATE_LIMIT_CONFIG.MAX_ATTEMPTS);
  });

  test("支援對 IP 與 Session Email 分別獨立安全綁定", () => {
    // 鎖定 IP
    for (let i = 1; i <= 5; i++) {
      recordInviteFailure(testIp);
    }
    assert.equal(checkInviteRateLimit(testIp).locked, true);
    assert.equal(checkInviteRateLimit(testSessionEmail).locked, false);
  });
});
