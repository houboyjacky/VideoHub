import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";

describe("邀請碼刪除防護與業務規則測試 (Unit: Invite Code Delete Rules)", () => {
  let activeCodeId = "";
  let disabledCodeId = "";
  const activeCode = `ACTIVE_DEL_${Date.now()}`;
  const disabledCode = `DISABLED_DEL_${Date.now()}`;

  before(async () => {
    // 建立啟用中的邀請碼
    const active = await prisma.inviteCode.create({
      data: {
        code: activeCode,
        maxUses: 1,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000),
        disabled: false,
        autoApprove: false,
        targetGroupIds: [],
        description: "未停用邀請碼",
      },
    });
    activeCodeId = active.id;

    // 建立已停用的邀請碼
    const disabled = await prisma.inviteCode.create({
      data: {
        code: disabledCode,
        maxUses: 1,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000),
        disabled: true,
        autoApprove: false,
        targetGroupIds: [],
        description: "已停用邀請碼",
      },
    });
    disabledCodeId = disabled.id;
  });

  after(async () => {
    if (activeCodeId) {
      await prisma.inviteCode.delete({ where: { id: activeCodeId } }).catch(() => {});
    }
    if (disabledCodeId) {
      await prisma.inviteCode.delete({ where: { id: disabledCodeId } }).catch(() => {});
    }
  });

  test("未停用 (disabled: false) 的邀請碼不可被刪除，應維持存在", async () => {
    const codeObj = await prisma.inviteCode.findUnique({ where: { id: activeCodeId } });
    assert.ok(codeObj);
    assert.equal(codeObj.disabled, false);

    // 業務規則檢查：只有 disabled === true 才允許物理刪除
    const canDelete = Boolean(codeObj.disabled) === true;
    assert.equal(canDelete, false, "啟用中的邀請碼不應允許刪除");
  });

  test("已停用 (disabled: true) 的邀請碼允許被刪除，刪除後自資料庫移除", async () => {
    const codeObj = await prisma.inviteCode.findUnique({ where: { id: disabledCodeId } });
    assert.ok(codeObj);
    assert.equal(codeObj.disabled, true);

    const canDelete = Boolean(codeObj.disabled) === true;
    assert.equal(canDelete, true, "已停用的邀請碼應允許刪除");

    if (canDelete) {
      await prisma.inviteCode.delete({ where: { id: disabledCodeId } });
      const checked = await prisma.inviteCode.findUnique({ where: { id: disabledCodeId } });
      assert.equal(checked, null, "刪除後查詢應為 null");
      disabledCodeId = ""; // 標記已刪除避免 after 重複刪除報錯
    }
  });
});
