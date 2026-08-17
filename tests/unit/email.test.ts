import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { maskSecret, getEmailConfigStatus } from "@/lib/email";

describe("Email 模組密碼遮罩與設定診斷單元測試 (Unit: Email Masking)", () => {
  test("maskSecret 應正確遮蔽密碼並保留前綴", () => {
    const maskedPass = maskSecret("mock_smtp_app_password_12345678", 4, 2);
    assert.match(maskedPass, /^mock•+78$/);
    assert.equal(maskedPass.includes("password"), false);

    const maskedKey = maskSecret("re_mock_test_key_abcdefg_9999", 5, 2);
    assert.match(maskedKey, /^re_mo•+99$/);
    assert.equal(maskedKey.includes("abcdefg"), false);
  });

  test("maskSecret 傳入空值或短字串時不應崩潰", () => {
    assert.equal(maskSecret(""), "未設定");
    assert.equal(maskSecret(undefined), "未設定");
    assert.equal(maskSecret("123"), "••••••••");
  });

  test("getEmailConfigStatus 應返回完整遮罩之設定狀態結構", () => {
    const status = getEmailConfigStatus();
    assert.equal(typeof status.smtp.configured, "boolean");
    assert.equal(typeof status.smtp.host, "string");
    assert.equal(typeof status.smtp.port, "number");
    assert.equal(typeof status.smtp.passMasked, "string");
    assert.equal(status.smtp.passMasked.includes("•"), true);

    assert.equal(typeof status.resend.configured, "boolean");
    assert.equal(typeof status.resend.apiKeyMasked, "string");
    assert.equal(Array.isArray(status.adminEmails), true);
  });
});
