import { describe, it } from "node:test";
import assert from "node:assert";
import {
  getSystemSettingsUseCase,
  updateSystemSettingsUseCase,
} from "@/lib/application/use-cases/system-settings.usecase";

describe("後台系統動態設定 UseCase 測試 (Unit: SystemSettings UseCase)", () => {
  it("預設狀態下能正確讀取設定並提供三層回退預設值", async () => {
    const settings = await getSystemSettingsUseCase();
    assert.ok(settings.appName);
    assert.ok(settings.adminName);
    assert.strictEqual(typeof settings.smtpPort, "number");
    assert.strictEqual(typeof settings.rateLimitMaxAttempts, "number");
  });

  it("能動態更新全域設定且留空時自動回退", async () => {
    const updateResult = await updateSystemSettingsUseCase({
      appName: "自訂影音平台",
      adminName: "超強管理員",
      rateLimitMaxAttempts: 8,
      adminEmail: "admin@example.com",
    });

    assert.strictEqual(updateResult.success, true);

    const refreshed = await getSystemSettingsUseCase();
    assert.strictEqual(refreshed.appName, "自訂影音平台");
    assert.strictEqual(refreshed.adminName, "超強管理員");
    assert.strictEqual(refreshed.rateLimitMaxAttempts, 8);
  });
});
