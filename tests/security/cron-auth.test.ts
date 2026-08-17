import { test, describe } from "node:test";
import assert from "node:assert/strict";

const PORT = process.env.PORT || "3000";
const BASE_URL = process.env.TEST_BASE_URL || `http://127.0.0.1:${PORT}`;

describe("Cron 定時排程金鑰安全與防護真機測試 (Security: Cron Auth)", () => {
  test("無任何 Authorization 標頭發送請求應被拒絕 (401 Unauthorized)", async () => {
    const res = await fetch(`${BASE_URL}/api/cron/sync-videos`, {
      method: "POST",
    });
    assert.equal(res.status, 401);

    const body = await res.json();
    assert.match(body.error, /未授權/);
  });

  test("攜帶錯誤的 Bearer Token 發送請求應被拒絕 (401 Unauthorized)", async () => {
    const res = await fetch(`${BASE_URL}/api/cron/sync-videos`, {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid_fake_secret_9999",
      },
    });
    assert.equal(res.status, 401);
  });

  test("攜帶非 Bearer 格式的 Authorization 標頭應被拒絕 (401 Unauthorized)", async () => {
    const res = await fetch(`${BASE_URL}/api/cron/sync-videos`, {
      method: "POST",
      headers: {
        Authorization: "Basic dXNlcjpwYXNz",
      },
    });
    assert.equal(res.status, 401);
  });

  test("攜帶正確的 CRON_SECRET 發送請求應授權通過 (200 OK)", async () => {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      // 若尚未在環境變數指定則跳過此項，避免假警報
      return;
    }

    const res = await fetch(`${BASE_URL}/api/cron/sync-videos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
  });
});
