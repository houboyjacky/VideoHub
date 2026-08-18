import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";
import { extractClientIp } from "@/lib/user-agent";
import {
  checkInviteRateLimit,
  recordInviteFailure,
  resetInviteRateLimit,
} from "@/lib/rate-limiter";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "請先登入 Google 帳號" },
        { status: 401 }
      );
    }

    const email = session.user.email.toLowerCase();
    const clientIp = extractClientIp(req.headers);
    const body = await req.json().catch(() => ({}));

    // 0. 安全防護：檢查 Session Email 與 Client IP 是否處於鎖定狀態
    const emailLimit = checkInviteRateLimit(email);
    const ipLimit = checkInviteRateLimit(clientIp);
    const isLocked = emailLimit.locked || ipLimit.locked;
    const remainingSec = Math.max(emailLimit.remainingSeconds, ipLimit.remainingSeconds);

    if (isLocked) {
      // 在活動日誌詳細記錄冷卻期間的存取攔截
      recordActivityLog({
        email,
        name: (body?.name || "").trim() || "訪客",
        action: "register_rate_limit_blocked",
        status: "failed",
        details: `帳號處於安全冷卻期內，系統拒絕註冊填碼請求 (剩餘鎖定時間: ${remainingSec} 秒)`,
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

    const { name, inviteCode } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "請填寫您的稱呼或姓名" },
        { status: 400 }
      );
    }

    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json(
        { error: "請輸入邀請碼" },
        { status: 400 }
      );
    }

    const codeClean = inviteCode.trim();

    // 1. 檢查使用者是否已經註冊過
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.status !== "unregistered") {
      return NextResponse.json(
        { error: `您已提交過申請，目前狀態為：${existingUser.status}` },
        { status: 400 }
      );
    }

    // 2. 驗證邀請碼
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
          name: name.trim(),
          action: "register_rate_limit_lockout",
          status: "failed",
          details: `註冊時連續輸入錯誤邀請碼達 5 次 (嘗試碼:「${codeClean}」)，觸發 15 分鐘安全冷卻鎖定`,
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
        name: name.trim(),
        action: "register_invite_failed",
        status: "failed",
        details: `註冊輸入錯誤邀請碼「${codeClean}」: ${errorMessage} (剩餘 ${attemptsLeft} 次機會)`,
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

    // 3. 建立或更新 User 狀態 (依 autoApprove 智慧分流)
    const isAuto = !!invite.autoApprove;
    const targetGroupIds = invite.targetGroupIds || [];
    const nowTimestamp = new Date();

    let newUser;
    if (existingUser) {
      const mergedGroupIds = isAuto
        ? Array.from(new Set([...(existingUser.groupIds || []), ...targetGroupIds]))
        : existingUser.groupIds || [];

      newUser = await prisma.user.update({
        where: { email },
        data: {
          name: name.trim(),
          status: isAuto ? "approved" : "pending",
          groupIds: mergedGroupIds,
          usedInviteCode: codeClean,
          approvedAt: isAuto ? nowTimestamp : existingUser.approvedAt,
          image: session.user.image || undefined,
        },
      });
    } else {
      newUser = await prisma.user.create({
        data: {
          email,
          name: name.trim(),
          status: isAuto ? "approved" : "pending",
          groupIds: isAuto ? targetGroupIds : [],
          usedInviteCode: codeClean,
          approvedAt: isAuto ? nowTimestamp : null,
          image: session.user.image || undefined,
        },
      });
    }

    // 4. 更新邀請碼使用記錄與次數
    await prisma.inviteCode.update({
      where: { id: invite.id },
      data: {
        usedCount: { increment: 1 },
        usedBy: { push: email },
      },
    });

    // 5. 若為 autoApprove 則發送歡迎信 (背景非同步處理不阻礙註冊)
    if (isAuto) {
      (async () => {
        try {
          const { sendWelcomeAutoApproveEmail } = await import("@/lib/email");
          const groups = await prisma.group.findMany({
            where: { id: { in: targetGroupIds } },
          });
          const groupNames = groups.map((g) => g.name);
          await sendWelcomeAutoApproveEmail(email, newUser.name, groupNames);
        } catch (mailErr) {
          console.error("[Register autoApprove Email Error]:", mailErr);
        }
      })();
    }

    // 重置邀請碼錯誤計數與鎖定狀態
    resetInviteRateLimit(email);
    resetInviteRateLimit(clientIp);

    // 6. 記錄註冊活動日誌
    recordActivityLog({
      email,
      name: newUser.name,
      image: newUser.image,
      userId: newUser.id,
      action: isAuto ? "auto_approved" : "register",
      status: "success",
      details: isAuto
        ? `使用邀請碼「${codeClean}」自動核准開通並綁定 ${targetGroupIds.length} 個分組`
        : `使用邀請碼「${codeClean}」提交會員審核申請`,
      req,
    });

    return NextResponse.json({
      success: true,
      autoApproved: isAuto,
      user: {
        id: newUser.id,
        name: newUser.name,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error("[Register API Error]:", error);
    return NextResponse.json(
      { error: "伺服器內部錯誤，請稍候重試" },
      { status: 500 }
    );
  }
}
