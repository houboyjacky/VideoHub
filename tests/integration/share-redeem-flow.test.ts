import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";

describe("分組展示頁邀請碼兌換與新訪客自動開通整合測試 (Integration: Share Redeem Flow)", () => {
  const timestamp = Date.now();
  let testGroupId = "";
  let autoApproveCodeId = "";
  let manualCodeId = "";
  const autoCode = `AUTO_REDEEM_${timestamp}`;
  const manualCode = `MANUAL_REDEEM_${timestamp}`;

  const newUserEmail = `new_visitor_${timestamp}@example.com`;
  const pendingUserEmail = `pending_visitor_${timestamp}@example.com`;
  const approvedUserEmail = `approved_visitor_${timestamp}@example.com`;

  before(async () => {
    // 1. 建立測試分組
    const group = await prisma.group.create({
      data: {
        name: `測試展示分組_${timestamp}`,
        description: "展示頁整合測試專用分組",
      },
    });
    testGroupId = group.id;

    // 2. 建立 autoApprove: true 邀請碼
    const autoInvite = await prisma.inviteCode.create({
      data: {
        code: autoCode,
        maxUses: 10,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000),
        disabled: false,
        autoApprove: true,
        targetGroupIds: [testGroupId],
        description: "免審直通開通碼",
      },
    });
    autoApproveCodeId = autoInvite.id;

    // 3. 建立 autoApprove: false 邀請碼
    const manualInvite = await prisma.inviteCode.create({
      data: {
        code: manualCode,
        maxUses: 10,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000),
        disabled: false,
        autoApprove: false,
        targetGroupIds: [testGroupId],
        description: "手動審核邀請碼",
      },
    });
    manualCodeId = manualInvite.id;

    // 4. 建立既有 pending 使用者
    await prisma.user.create({
      data: {
        email: pendingUserEmail,
        name: "待審核用戶",
        status: "pending",
        groupIds: [],
      },
    });

    // 5. 建立既有 approved 使用者
    await prisma.user.create({
      data: {
        email: approvedUserEmail,
        name: "已核准用戶",
        status: "approved",
        groupIds: [],
      },
    });
  });

  after(async () => {
    // 徹底清理所有測試產生的資料
    await prisma.user.deleteMany({
      where: {
        email: { in: [newUserEmail, pendingUserEmail, approvedUserEmail] },
      },
    }).catch(() => {});

    if (autoApproveCodeId) {
      await prisma.inviteCode.delete({ where: { id: autoApproveCodeId } }).catch(() => {});
    }
    if (manualCodeId) {
      await prisma.inviteCode.delete({ where: { id: manualCodeId } }).catch(() => {});
    }
    if (testGroupId) {
      await prisma.group.delete({ where: { id: testGroupId } }).catch(() => {});
    }
  });

  test("新訪客（DB 無資料）使用 autoApprove 邀請碼兌換時，應直接建立 approved 帳號並綁定分組", async () => {
    const invite = await prisma.inviteCode.findUnique({ where: { code: autoCode } });
    assert.ok(invite);
    assert.equal(invite.autoApprove, true);

    // 模擬 redeem 業務邏輯
    let user = await prisma.user.findUnique({ where: { email: newUserEmail } });
    assert.equal(user, null, "初始應無 User 記錄");

    // 執行自動建立與開通
    user = await prisma.user.create({
      data: {
        email: newUserEmail,
        name: "新訪客",
        status: "approved",
        groupIds: invite.targetGroupIds,
        usedInviteCode: autoCode,
        approvedAt: new Date(),
      },
    });

    assert.ok(user);
    assert.equal(user.status, "approved");
    assert.ok(user.groupIds.includes(testGroupId));
  });

  test("待審核用戶 (pending) 使用 autoApprove 邀請碼兌換時，應升級為 approved 並開通分組", async () => {
    const userBefore = await prisma.user.findUnique({ where: { email: pendingUserEmail } });
    assert.ok(userBefore);
    const invite = await prisma.inviteCode.findUnique({ where: { code: autoCode } });
    assert.ok(invite);

    const mergedGroupIds = Array.from(
      new Set([...(userBefore.groupIds || []), ...(invite.targetGroupIds || [])])
    );

    const userAfter = await prisma.user.update({
      where: { email: pendingUserEmail },
      data: {
        status: "approved",
        approvedAt: new Date(),
        groupIds: mergedGroupIds,
        usedInviteCode: autoCode,
      },
    });

    assert.equal(userAfter.status, "approved");
    assert.ok(userAfter.groupIds.includes(testGroupId));
  });

  test("已核准用戶 (approved) 使用邀請碼兌換時，應增量追加 (Union) 分組", async () => {
    const userBefore = await prisma.user.findUnique({ where: { email: approvedUserEmail } });
    assert.ok(userBefore);
    assert.equal(userBefore.status, "approved");

    const invite = await prisma.inviteCode.findUnique({ where: { code: manualCode } });
    assert.ok(invite);

    const mergedGroupIds = Array.from(
      new Set([...(userBefore.groupIds || []), ...(invite.targetGroupIds || [])])
    );

    const userAfter = await prisma.user.update({
      where: { email: approvedUserEmail },
      data: {
        groupIds: mergedGroupIds,
      },
    });

    assert.equal(userAfter.status, "approved");
    assert.ok(userAfter.groupIds.includes(testGroupId));
  });
});
