import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateShareId } from "@/lib/share-id";

describe("分組隨機分享 ID 生成單元測試 (Unit: Share ID Generator)", () => {
  test("generateShareId 應生成長度恰為 10 碼的字串", () => {
    const shareId = generateShareId();
    assert.equal(typeof shareId, "string");
    assert.equal(shareId.length, 10);
  });

  test("generateShareId 應僅包含 URL-safe 字元 (A-Z, a-z, 0-9, -, _)", () => {
    for (let i = 0; i < 50; i++) {
      const shareId = generateShareId();
      assert.match(shareId, /^[A-Za-z0-9_-]{10}$/);
    }
  });

  test("連續生成 100 次 shareId 應具備唯一性不發生碰撞", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateShareId());
    }
    assert.equal(ids.size, 100);
  });
});
