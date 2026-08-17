import { test, describe } from "node:test";
import assert from "node:assert/strict";

const PORT = process.env.PORT || "3000";
const BASE_URL = process.env.TEST_BASE_URL || `http://127.0.0.1:${PORT}`;

describe("後台 API 全路徑未授權防護真機測試 (Security: Admin API Endpoints 403)", () => {
  const dummyId = "dummy_id_123456789012";

  test("GET /api/admin/videos 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/videos`);
    assert.equal(res.status, 403);
  });

  test("POST /api/admin/videos 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://youtu.be/dQw4w9WgXcQ" }),
    });
    assert.equal(res.status, 403);
  });

  test("PUT /api/admin/videos/[id] 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/videos/${dummyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Unauthorized Title" }),
    });
    assert.equal(res.status, 403);
  });

  test("DELETE /api/admin/videos/[id] 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/videos/${dummyId}`, {
      method: "DELETE",
    });
    assert.equal(res.status, 403);
  });

  test("PUT /api/admin/videos/batch-groups 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/videos/batch-groups`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoIds: [dummyId], groupIds: [] }),
    });
    assert.equal(res.status, 403);
  });

  test("GET /api/admin/users 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`);
    assert.equal(res.status, 403);
  });

  test("POST /api/admin/users/[id]/approve 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/${dummyId}/approve`, {
      method: "POST",
    });
    assert.equal(res.status, 403);
  });

  test("POST /api/admin/users/[id]/reject 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/${dummyId}/reject`, {
      method: "POST",
    });
    assert.equal(res.status, 403);
  });

  test("PUT /api/admin/users/[id]/groups 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/${dummyId}/groups`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupIds: ["g1"] }),
    });
    assert.equal(res.status, 403);
  });

  test("GET /api/admin/groups 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/groups`);
    assert.equal(res.status, 403);
  });

  test("POST /api/admin/groups 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hacked Group" }),
    });
    assert.equal(res.status, 403);
  });

  test("DELETE /api/admin/groups/[id] 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/groups/${dummyId}`, {
      method: "DELETE",
    });
    assert.equal(res.status, 403);
  });

  test("GET /api/admin/invite-codes 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/invite-codes`);
    assert.equal(res.status, 403);
  });

  test("POST /api/admin/invite-codes 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/invite-codes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxUses: 5, validDays: 7 }),
    });
    assert.equal(res.status, 403);
  });

  test("POST /api/admin/invite-codes/[id]/disable 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/invite-codes/${dummyId}/disable`, {
      method: "POST",
    });
    assert.equal(res.status, 403);
  });

  test("GET /api/admin/sync-channel 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/sync-channel`);
    assert.equal(res.status, 403);
  });

  test("POST /api/admin/sync-channel 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/sync-channel`, {
      method: "POST",
    });
    assert.equal(res.status, 403);
  });

  test("GET /api/admin/email-settings 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/email-settings`);
    assert.equal(res.status, 403);
  });

  test("POST /api/admin/email-settings 未授權應回傳 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/email-settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "smtp" }),
    });
    assert.equal(res.status, 403);
  });

  test("GET /api/videos 未登入應回傳 401 Unauthorized", async () => {
    const res = await fetch(`${BASE_URL}/api/videos`);
    assert.equal(res.status, 401);
  });
});
