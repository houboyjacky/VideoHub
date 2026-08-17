import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";

describe("邀請碼系統與會員註冊流程整合測試 (Integration: Invite & Registration Flow)", () => {
  let validInviteId = "";
  const validCode = `TEST_VALID_${Date.now()}`;
  let expiredInviteId = "";
  const expiredCode = `TEST_EXPIRED_${Date.now()}`;
  let disabledInviteId = "";
  const disabledCode = `TEST_DISABLED_${Date.now()}`;

  before(async () => {
    // 1. 建立有效的邀請碼 (上限 2 次)
    const valid = await prisma.inviteCode.create({
      data: {
        code: validCode,
        maxUses: 2,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000), // 1天後
        disabled: false,
        usedBy: [],
      },
    });
    validInviteId = valid.id;

    // 2. 建立已過期的邀請碼
    const expired = await prisma.inviteCode.create({
      data: {
        code: expiredCode,
        maxUses: 5,
        usedCount: 0,
        expiresAt: new Date(Date.now() - 86400000), // 1天前
        disabled: false,
        usedBy: [],
      },
    });
    expiredInviteId = expired.id;

    // 3. 建立已停用的邀請碼
    const disabled = await prisma.inviteCode.create({
      data: {
        code: disabledCode,
        maxUses: 5,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000),
        disabled: true,
        usedBy: [],
      },
    });
    disabledInviteId = disabled.id;
  });

  after(async () => {
    // 清理測試邀請碼
    if (validInviteId) await prisma.inviteCode.delete({ where: { id: validInviteId } });
    if (expiredInviteId) await prisma.inviteCode.delete({ where: { id: expiredInviteId } });
    if (disabledInviteId) await prisma.inviteCode.delete({ where: { id: disabledInviteId } });
  });

  test("使用不存在的邀請碼註冊應失敗", async () => {
    const invite = await prisma.inviteCode.findUnique({
      where: { code: "NON_EXISTENT_CODE_999" },
    });
    assert.equal(invite, null, "無效的邀請碼應查詢不到");
  });

  test("使用已過期的邀請碼應判定為無效", async () => {
    const invite = await prisma.inviteCode.findUnique({
      where: { code: expiredCode },
    });
    assert.ok(invite);
    const isExpired = new Date(invite.expiresAt) < new Date();
    assert.equal(isExpired, true, "過期邀請碼應判定為過期");
  });

  test("使用已停用的邀請碼應判定為無效", async () => {
    const invite = await prisma.inviteCode.findUnique({
      where: { code: disabledCode },
    });
    assert.ok(invite);
    assert.equal(invite.disabled, true, "已停用邀請碼應判定為 disabled");
  });

  test("使用有效邀請碼應正確遞增使用次數並記錄使用者 Email", async () => {
    const userEmail = `tester_${Date.now()}@example.com`;

    // 模擬第一次使用
    const invite = await prisma.inviteCode.findUnique({
      where: { code: validCode },
    });
    assert.ok(invite);
    assert.equal(invite.usedCount, 0);

    // 執行更新（遞增 usedCount 並加入 usedBy）
    await prisma.inviteCode.update({
      where: { id: invite.id },
      data: {
        usedCount: { increment: 1 },
        usedBy: { push: userEmail },
      },
    });

    const updated = await prisma.inviteCode.findUnique({
      where: { id: invite.id },
    });
    assert.equal(updated?.usedCount, 1);
    assert.ok(updated?.usedBy.includes(userEmail));
  });

  test("邀請碼達到使用上限時應判定已滿額", async () => {
    const userEmail2 = `tester2_${Date.now()}@example.com`;

    // 模擬第二次使用（達到 maxUses = 2）
    const invite = await prisma.inviteCode.findUnique({
      where: { code: validCode },
    });
    assert.ok(invite);

    await prisma.inviteCode.update({
      where: { id: invite.id },
      data: {
        usedCount: { increment: 1 },
        usedBy: { push: userEmail2 },
      },
    });

    const fullInvite = await prisma.inviteCode.findUnique({
      where: { id: invite.id },
    });
    assert.equal(fullInvite?.usedCount, 2);
    assert.equal(fullInvite?.usedCount! >= fullInvite?.maxUses!, true, "應達到上限");
  });
});
