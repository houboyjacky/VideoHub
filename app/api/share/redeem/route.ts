import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";
import { sendWelcomeAutoApproveEmail } from "@/lib/email";
import { extractClientIp } from "@/lib/user-agent";
import {
  checkInviteRateLimit,
  recordInviteFailure,
  resetInviteRateLimit,
} from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "請先登入 Google 帳號" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const sessionName = session.user.name || "會員";
    const sessionImage = session.user.image || undefined;
    const clientIp = extractClientIp(req.headers);

    // 0. 安全防護：檢查 Session Email 與 Client IP 是否處於鎖定狀態
    const emailLimit = checkInviteRateLimit(email);
    const ipLimit = checkInviteRateLimit(clientIp);
    const isLocked = emailLimit.locked || ipLimit.locked;
    const remainingSec = Math.max(emailLimit.remainingSeconds, ipLimit.remainingSeconds);

    if (isLocked) {
      // 在活動日誌詳細記錄冷卻期間的存取攔截
      recordActivityLog({
        email,
        name: sessionName,
        image: sessionImage,
        action: "invite_rate_limit_blocked",
        status: "failed",
        details: `帳號處於安全冷卻期內，系統拒絕兌換請求 (剩餘鎖定時間: ${remainingSec} 秒)`,
        req,
      });

      // 對使用者不透露剩餘秒數，維持安全簡潔提示
      return NextResponse.json(
        {
          error: "輸入錯誤次數過多，操作已被暫時限制，請稍後再試。",
        },
        { status: 429 }
      );
    }

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

    // 輔助函式：記錄失敗並更新鎖定狀態與詳細審計日誌
    const handleInvalidCode = (errorMessage: string) => {
      const failEmail = recordInviteFailure(email);
      const failIp = recordInviteFailure(clientIp);
      const nowLocked = failEmail.locked || failIp.locked;
      const attemptsLeft = Math.min(failEmail.attemptsLeft, failIp.attemptsLeft);

      if (nowLocked) {
        // 觸發鎖定：記錄詳細日誌
        recordActivityLog({
          email,
          name: sessionName,
          image: sessionImage,
          action: "invite_rate_limit_lockout",
          status: "failed",
          details: `連續輸入錯誤邀請碼達 5 次 (嘗試碼:「${codeClean}」)，觸發 15 分鐘安全冷卻鎖定`,
          req,
        });

        // 對使用者不透露具體時間
        return NextResponse.json(
          {
            error: "輸入錯誤次數過多，操作已被暫時限制，請稍後再試。",
          },
          { status: 429 }
        );
      }

      // 未達上限：日誌記錄單次失敗紀錄
      recordActivityLog({
        email,
        name: sessionName,
        image: sessionImage,
        action: "invite_code_failed",
        status: "failed",
        details: `輸入錯誤邀請碼「${codeClean}」: ${errorMessage} (剩餘 ${attemptsLeft} 次機會)`,
        req,
      });

      // 對使用者只回應錯誤原因，不暴露剩餘次數
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    };

    if (!invite) {
      return handleInvalidCode("無效的邀請碼，請確認是否輸入正確");
    }

    if (invite.disabled) {
      return handleInvalidCode("此邀請碼已被管理員停用");
    }

    const now = new Date();
    if (new Date(invite.expiresAt) < now) {
      return handleInvalidCode("此邀請碼已超過有效期限");
    }

    if (invite.usedCount >= invite.maxUses) {
      return handleInvalidCode("此邀請碼已達使用次數上限");
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

    // 成功兌換，重置錯誤計數與鎖定狀態
    resetInviteRateLimit(email);
    resetInviteRateLimit(clientIp);

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
