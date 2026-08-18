import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";

describe("使用者個人名稱修改單元測試 (Unit: User Profile Update)", () => {
  const timestamp = Date.now();
  const testEmail = `profile_test_${timestamp}@example.com`;
  let testUserId = "";

  before(async () => {
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "原始名稱",
        status: "approved",
        groupIds: [],
      },
    });
    testUserId = user.id;
  });

  after(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  });

  test("名稱不能為空字串或純空格", () => {
    const invalidNames = ["", "   ", "\t\n"];
    for (const n of invalidNames) {
      const isValid = typeof n === "string" && n.trim().length > 0;
      assert.equal(isValid, false, `名稱「${n}」應被判定為無效`);
    }
  });

  test("正常修改名稱時，應成功更新資料庫並保留其他欄位", async () => {
    const newName = "全新稱呼 Jacky 朋友";
    const updated = await prisma.user.update({
      where: { email: testEmail },
      data: { name: newName.trim() },
    });

    assert.equal(updated.name, newName);
    assert.equal(updated.email, testEmail);
    assert.equal(updated.status, "approved");
  });
});
