import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { getAdminDisplayName } from "@/lib/admin-helper";
import { prisma } from "@/lib/prisma";

describe("管理員名稱取得單元測試 (Unit: Admin Helper)", () => {
  const originalEnv = process.env.NEXT_PUBLIC_ADMIN_NAME;
  const originalAdminEmails = process.env.ADMIN_EMAILS;
  let testAdminUserId = "";
  const testAdminEmail = `test_admin_${Date.now()}@example.com`;

  before(async () => {
    // 建立測試管理員
    const adminUser = await prisma.user.create({
      data: {
        email: testAdminEmail,
        name: "測試管理員小明",
        status: "approved",
        groupIds: [],
      },
    });
    testAdminUserId = adminUser.id;
  });

  after(async () => {
    if (testAdminUserId) {
      await prisma.user.delete({ where: { id: testAdminUserId } }).catch(() => {});
    }
    process.env.NEXT_PUBLIC_ADMIN_NAME = originalEnv;
    process.env.ADMIN_EMAILS = originalAdminEmails;
  });

  test("當 DB 存在管理員時，getAdminDisplayName 應正確返回該管理員之 user.name", async () => {
    process.env.ADMIN_EMAILS = testAdminEmail;
    const name = await getAdminDisplayName();
    assert.equal(name, "測試管理員小明");
  });

  test("當 DB 查無管理員但有設定 NEXT_PUBLIC_ADMIN_NAME 時，應 fallback 至該環境變數", async () => {
    process.env.ADMIN_EMAILS = "non_existent_admin@example.com";
    process.env.NEXT_PUBLIC_ADMIN_NAME = "站長阿翔";
    const name = await getAdminDisplayName();
    assert.equal(name, "站長阿翔");
  });

  test("當 DB 查無管理員且無 NEXT_PUBLIC_ADMIN_NAME 時，應 fallback 至預設值「管理員」", async () => {
    process.env.ADMIN_EMAILS = "non_existent_admin@example.com";
    delete process.env.NEXT_PUBLIC_ADMIN_NAME;
    const name = await getAdminDisplayName();
    assert.equal(name, "管理員");
  });
});
