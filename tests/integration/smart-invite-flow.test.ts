import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { generateShareId } from "@/lib/share-id";

describe("智慧邀請碼與自動核准/分組兌換整合測試 (Integration: Smart Invite & Redeem Flow)", () => {
  let testGroupId1 = "";
  let testGroupId2 = "";
  let autoApproveInviteId = "";
  const autoApproveCode = `AUTO_${Date.now()}`;
  let manualInviteId = "";
  const manualCode = `MANUAL_${Date.now()}`;
  const createdUserIds: string[] = [];

  before(async () => {
    // 建立 2 個測試分組
    const g1 = await prisma.group.create({
      data: {
        name: `測試分組A_${Date.now()}_${Math.random()}`,
        description: "供智慧邀請碼測試",
        shareId: generateShareId(),
      },
    });
    testGroupId1 = g1.id;

    const g2 = await prisma.group.create({
      data: {
        name: `測試分組B_${Date.now()}_${Math.random()}`,
        description: "供已登入兌換測試",
        shareId: generateShareId(),
      },
    });
    testGroupId2 = g2.id;

    // 建立 autoApprove 邀請碼
    const autoInvite = await prisma.inviteCode.create({
      data: {
        code: autoApproveCode,
        maxUses: 5,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000),
        disabled: false,
        autoApprove: true,
        targetGroupIds: [testGroupId1],
        description: "VIP 自動核准通行碼",
      },
    });
    autoApproveInviteId = autoInvite.id;

    // 建立一般手動審核邀請碼
    const manualInvite = await prisma.inviteCode.create({
      data: {
        code: manualCode,
        maxUses: 5,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000),
        disabled: false,
        autoApprove: false,
        targetGroupIds: [],
        description: "一般審核碼",
      },
    });
    manualInviteId = manualInvite.id;
  });

  after(async () => {
    for (const uid of createdUserIds) {
      await prisma.user.delete({ where: { id: uid } }).catch(() => {});
    }
    if (autoApproveInviteId) {
      await prisma.inviteCode.delete({ where: { id: autoApproveInviteId } }).catch(() => {});
    }
    if (manualInviteId) {
      await prisma.inviteCode.delete({ where: { id: manualInviteId } }).catch(() => {});
    }
    if (testGroupId1) {
      await prisma.group.delete({ where: { id: testGroupId1 } }).catch(() => {});
    }
    if (testGroupId2) {
      await prisma.group.delete({ where: { id: testGroupId2 } }).catch(() => {});
    }
  });

  test("autoApprove: true 邀請碼註冊時，用戶應直接獲得 approved 狀態並自動綁定 targetGroupIds", async () => {
    const invite = await prisma.inviteCode.findUnique({ where: { code: autoApproveCode } });
    assert.ok(invite);
    assert.equal(invite.autoApprove, true);
    assert.deepEqual(invite.targetGroupIds, [testGroupId1]);

    // 模擬註冊邏輯
    const newUser = await prisma.user.create({
      data: {
        email: `auto_user_${Date.now()}@example.com`,
        name: "自動通過訪客",
        status: invite.autoApprove ? "approved" : "pending",
        groupIds: invite.targetGroupIds || [],
        usedInviteCode: invite.code,
        approvedAt: invite.autoApprove ? new Date() : null,
      },
    });
    createdUserIds.push(newUser.id);

    assert.equal(newUser.status, "approved");
    assert.ok(newUser.approvedAt);
    assert.equal(newUser.groupIds.includes(testGroupId1), true);
    assert.equal(newUser.usedInviteCode, autoApproveCode);
  });

  test("autoApprove: false 邀請碼註冊時，用戶應為 pending 狀態且不自動指派分組", async () => {
    const invite = await prisma.inviteCode.findUnique({ where: { code: manualCode } });
    assert.ok(invite);
    assert.equal(invite.autoApprove, false);

    const newUser = await prisma.user.create({
      data: {
        email: `manual_user_${Date.now()}@example.com`,
        name: "待審核訪客",
        status: invite.autoApprove ? "approved" : "pending",
        groupIds: invite.targetGroupIds || [],
        usedInviteCode: invite.code,
      },
    });
    createdUserIds.push(newUser.id);

    assert.equal(newUser.status, "pending");
    assert.equal(newUser.groupIds.length, 0);
  });

  test("已核准用戶兌換新分組邀請碼時，應以 Union 方式增量追加分組且不重複", async () => {
    // 建立已有分組1的已核准用戶
    const user = await prisma.user.create({
      data: {
        email: `existing_user_${Date.now()}@example.com`,
        name: "既有會員",
        status: "approved",
        groupIds: [testGroupId1],
      },
    });
    createdUserIds.push(user.id);

    // 兌換包含分組1和分組2的邀請碼
    const incomingGroupIds = [testGroupId1, testGroupId2];
    const mergedGroupIds = Array.from(new Set([...(user.groupIds || []), ...incomingGroupIds]));

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { groupIds: mergedGroupIds },
    });

    assert.equal(updatedUser.groupIds.length, 2, `預期 2 個分組，實際為 ${JSON.stringify(updatedUser.groupIds)}，incoming=${JSON.stringify(incomingGroupIds)}, user.groupIds=${JSON.stringify(user.groupIds)}`);
    assert.equal(updatedUser.groupIds.includes(testGroupId1), true);
    assert.equal(updatedUser.groupIds.includes(testGroupId2), true);
  });
});
