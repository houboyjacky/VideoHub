import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";
import { sendWelcomeAutoApproveEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "請先登入 Google 帳號" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const sessionName = session.user.name || "會員";
    const sessionImage = session.user.image || undefined;

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({ error: "請輸入邀請碼" }, { status: 400 });
    }

    const codeClean = code.trim().toUpperCase();

    // 1. 查詢並驗證邀請碼
    const invite = await prisma.inviteCode.findUnique({
      where: { code: codeClean },
    });

    if (!invite) {
      return NextResponse.json({ error: "無效的邀請碼，請確認是否輸入正確" }, { status: 400 });
    }

    if (invite.disabled) {
      return NextResponse.json({ error: "此邀請碼已被管理員停用" }, { status: 400 });
    }

    const now = new Date();
    if (new Date(invite.expiresAt) < now) {
      return NextResponse.json({ error: "此邀請碼已超過有效期限" }, { status: 400 });
    }

    if (invite.usedCount >= invite.maxUses) {
      return NextResponse.json({ error: "此邀請碼已達使用次數上限" }, { status: 400 });
    }

    const incomingGroupIds = invite.targetGroupIds || [];
    const isAuto = !!invite.autoApprove;

    // 查詢目標分組名稱
    const unlockedGroups = await prisma.group.findMany({
      where: { id: { in: incomingGroupIds } },
    });
    const groupNames = unlockedGroups.map((g) => g.name);

    // 查詢使用者在 DB 中現況
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser?.disabled) {
      return NextResponse.json(
        { error: "您的帳號已被管理員停用，無法進行分組兌換" },
        { status: 403 }
      );
    }

    let resultUser;
    let isNewlyUnlocked = false;
    let isPendingApproval = false;

    // 分支情況處理：
    if (!existingUser) {
      // 情況 1：新訪客直接透過兌換碼初次註冊
      if (isAuto) {
        // 免審直通：直接建立 approved 帳號
        resultUser = await prisma.user.create({
          data: {
            email,
            name: sessionName,
            image: sessionImage,
            status: "approved",
            approvedAt: now,
            groupIds: incomingGroupIds,
            usedInviteCode: codeClean,
            lastLoginAt: now,
          },
        });
        isNewlyUnlocked = true;

        // 背景發送開通通知 Email
        sendWelcomeAutoApproveEmail(email, sessionName, groupNames).catch(
          (err: unknown) => console.error("[Redeem Email Error]:", err)
        );
      } else {
        // 需審核：建立 pending 帳號
        resultUser = await prisma.user.create({
          data: {
            email,
            name: sessionName,
            image: sessionImage,
            status: "pending",
            groupIds: [],
            usedInviteCode: codeClean,
            lastLoginAt: now,
          },
        });
        isPendingApproval = true;
      }
    } else if (existingUser.status === "pending") {
      // 情況 2：原本是待審核用戶
      if (isAuto) {
        // 使用免審直通邀請碼直接升級為 approved
        const mergedGroupIds = Array.from(
          new Set([...(existingUser.groupIds || []), ...incomingGroupIds])
        );
        resultUser = await prisma.user.update({
          where: { email },
          data: {
            status: "approved",
            approvedAt: now,
            groupIds: mergedGroupIds,
            usedInviteCode: codeClean,
            lastLoginAt: now,
          },
        });
        isNewlyUnlocked = true;

        sendWelcomeAutoApproveEmail(
          email,
          existingUser.name || sessionName,
          groupNames
        ).catch((err: unknown) => console.error("[Redeem Email Error]:", err));
      } else {
        // 手動審核邀請碼：記錄邀請碼並維持 pending
        resultUser = await prisma.user.update({
          where: { email },
          data: {
            usedInviteCode: codeClean,
            lastLoginAt: now,
          },
        });
        isPendingApproval = true;
      }
    } else {
      // 情況 3：原本已是 approved 用戶（增量追加分組）
      const existingGroupIds = existingUser.groupIds || [];
      const mergedGroupIds = Array.from(
        new Set([...existingGroupIds, ...incomingGroupIds])
      );

      resultUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          groupIds: mergedGroupIds,
          lastLoginAt: now,
        },
      });
      isNewlyUnlocked = true;
    }

    // 遞增邀請碼使用次數
    await prisma.inviteCode.update({
      where: { id: invite.id },
      data: {
        usedCount: { increment: 1 },
        usedBy: { push: email },
      },
    });

    const groupNamesStr =
      groupNames.length > 0 ? groupNames.join("、") : "專屬分組";

    // 記錄審計日誌
    recordActivityLog({
      email,
      name: resultUser.name,
      image: resultUser.image,
      userId: resultUser.id,
      action: "redeem_invite_code",
      status: "success",
      details: isNewlyUnlocked
        ? `使用邀請碼「${codeClean}」成功解鎖並開通 ${groupNamesStr}`
        : `使用邀請碼「${codeClean}」提交註冊審核申請`,
      req,
    });

    if (isPendingApproval) {
      return NextResponse.json({
        success: true,
        pending: true,
        message: "🎉 申請已送出！您的帳號正在等待管理員審核，審核通過後將自動開通專屬分組。",
      });
    }

    return NextResponse.json({
      success: true,
      unlocked: true,
      message: `🎉 成功解鎖【${groupNamesStr}】專屬影音內容！`,
    });
  } catch (error) {
    console.error("[Redeem Invite Code Error]:", error);
    return NextResponse.json({ error: "兌換失敗，請稍後再試" }, { status: 500 });
  }
}
