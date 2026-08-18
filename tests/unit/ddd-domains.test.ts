import { describe, it } from "node:test";
import assert from "node:assert";
import { canTransitionUserStatus } from "@/lib/domains/identity/user-status";
import { validateProfileName } from "@/lib/domains/identity/profile-validator";
import { validateInviteCodeRules, canDeleteInviteCode } from "@/lib/domains/invitation/invite-rules";
import { generateShareId } from "@/lib/domains/media/share-id";
import { extractYouTubeId, parseChannelOrPlaylistInput } from "@/lib/domains/media/youtube-parser";
import { parseUserAgent, extractClientIp } from "@/lib/domains/audit/user-agent";
import { getAuditConfig } from "@/lib/domains/audit/config";
import { maskSecret } from "@/lib/domains/notification/mailer-types";
import { buildWelcomeEmailHtml, buildTestEmailHtml } from "@/lib/domains/notification/templates";

describe("DDD 領域層純邏輯單元測試 (Unit: DDD Domains)", () => {
  describe("Identity 領域", () => {
    it("驗證使用者狀態合法流轉", () => {
      assert.strictEqual(canTransitionUserStatus("unregistered", "pending"), true);
      assert.strictEqual(canTransitionUserStatus("unregistered", "approved"), true);
      assert.strictEqual(canTransitionUserStatus("pending", "approved"), true);
      assert.strictEqual(canTransitionUserStatus("pending", "rejected"), true);
      assert.strictEqual(canTransitionUserStatus("approved", "disabled"), true);
    });

    it("校驗個人稱呼合法性", () => {
      const valid = validateProfileName("小明");
      assert.strictEqual(valid.isValid, true);
      assert.strictEqual(valid.name, "小明");

      const empty = validateProfileName("   ");
      assert.strictEqual(empty.isValid, false);

      const tooLong = validateProfileName("a".repeat(51));
      assert.strictEqual(tooLong.isValid, false);
    });
  });

  describe("Invitation 領域", () => {
    it("校驗邀請碼過期與次數規則", () => {
      const validInvite: any = {
        id: "1",
        code: "TEST1234",
        maxUses: 10,
        usedCount: 5,
        expiresAt: new Date(Date.now() + 100000),
        disabled: false,
      };
      assert.strictEqual(validateInviteCodeRules(validInvite).isValid, true);

      const expiredInvite = { ...validInvite, expiresAt: new Date(Date.now() - 100000) };
      assert.strictEqual(validateInviteCodeRules(expiredInvite).isValid, false);

      const fullInvite = { ...validInvite, usedCount: 10 };
      assert.strictEqual(validateInviteCodeRules(fullInvite).isValid, false);

      const disabledInvite = { ...validInvite, disabled: true };
      assert.strictEqual(validateInviteCodeRules(disabledInvite).isValid, false);
    });

    it("邀請碼安全刪除規則", () => {
      assert.strictEqual(canDeleteInviteCode({ disabled: true } as any), true);
      assert.strictEqual(canDeleteInviteCode({ disabled: false } as any), false);
    });
  });

  describe("Media 領域", () => {
    it("10 碼 URL-safe 隨機分享 ID 生成", () => {
      const id = generateShareId(10);
      assert.strictEqual(id.length, 10);
      assert.match(id, /^[A-Za-z0-9_-]{10}$/);
    });

    it("YouTube 網址解析", () => {
      assert.strictEqual(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
      const parsed = parseChannelOrPlaylistInput("https://www.youtube.com/@techchannel");
      assert.strictEqual(parsed.type, "handle");
      assert.strictEqual(parsed.value, "techchannel");
    });
  });

  describe("Audit 領域", () => {
    it("User-Agent 與 IP 解析", () => {
      const ua = parseUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
      assert.strictEqual(ua.os, "Windows 10/11");
      assert.strictEqual(ua.browser, "Chrome 120");

      const ip = extractClientIp({ get: (h: string) => (h === "x-forwarded-for" ? "203.0.113.195, 10.0.0.1" : null) } as any);
      assert.strictEqual(ip, "203.0.113.195");
    });

    it("AuditConfig 智慧預設值讀取", () => {
      const config = getAuditConfig();
      assert.ok(["debug", "info", "warn", "error"].includes(config.logLevel));
      assert.strictEqual(typeof config.activityLogPageSize, "number");
      assert.strictEqual(typeof config.rateLimitMaxAttempts, "number");
    });
  });

  describe("Notification 領域", () => {
    it("機密字串遮罩", () => {
      assert.strictEqual(maskSecret("AIzaSy1234567890"), "AIz•••••••••••90");
      assert.strictEqual(maskSecret("123"), "••••");
      assert.strictEqual(maskSecret(""), "未設定");
    });

    it("HTML 模板生成", () => {
      const welcome = buildWelcomeEmailHtml({
        userName: "王小明",
        adminName: "Jacky",
        appName: "VideoHub",
        loginUrl: "http://localhost:3000/feed",
      });
      assert.ok(welcome.includes("王小明"));
      assert.ok(welcome.includes("VideoHub"));

      const test = buildTestEmailHtml({
        adminName: "Jacky",
        appName: "VideoHub",
        testedAt: "2026-08-19 12:00:00",
        provider: "Gmail SMTP",
      });
      assert.ok(test.includes("Gmail SMTP"));
    });
  });
});
