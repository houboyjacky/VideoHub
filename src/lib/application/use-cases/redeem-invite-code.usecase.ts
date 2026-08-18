import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";
import { sendWelcomeAutoApproveEmail } from "@/lib/email";
import {
  checkInviteRateLimit,
  recordInviteFailure,
  resetInviteRateLimit,
} from "@/lib/domains/invitation/rate-limiter";
import { validateInviteCodeRules } from "@/lib/domains/invitation/invite-rules";

export interface RedeemInviteInput {
  email: string;
  sessionName: string;
  sessionImage?: string;
  clientIp: string;
  code: string;
  reqHeaders?: Headers | Request | null;
}

export interface RedeemInviteOutput {
  success: boolean;
  statusCode: number;
  message?: string;
  error?: string;
  autoApproved?: boolean;
  assignedGroupsCount?: number;
  userStatus?: string;
}

/**
 * Application Use Case: 兌換邀請碼
 */
export async function redeemInviteCodeUseCase(input: RedeemInviteInput): Promise<RedeemInviteOutput> {
  const { email, sessionName, sessionImage, clientIp, code, reqHeaders } = input;
  const normalizedEmail = email.toLowerCase().trim();

  // 1. 安全防禦：檢查 Session Email 與 Client IP 是否處於鎖定狀態
  const emailLimit = checkInviteRateLimit(normalizedEmail);
  const ipLimit = checkInviteRateLimit(clientIp);
  const isLocked = emailLimit.isLocked || ipLimit.isLocked;
  const remainingSec = Math.max(emailLimit.remainingSeconds, ipLimit.remainingSeconds);

  if (isLocked) {
    recordActivityLog({
      email: normalizedEmail,
      name: sessionName,
      image: sessionImage,
      action: "invite_rate_limit_blocked",
      status: "failed",
      details: `帳號處於安全冷卻期內，系統拒絕兌換請求 (剩餘鎖定時間: ${remainingSec} 秒)`,
      req: reqHeaders,
      ip: clientIp,
    });

    return {
      success: false,
      statusCode: 429,
      error: "輸入錯誤次數過多，操作已被暫時限制，請稍後再試。",
    };
  }

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return {
      success: false,
      statusCode: 400,
      error: "請輸入邀請碼",
    };
  }

  const codeClean = code.trim().toUpperCase();

  // 2. 查詢邀請碼
  const invite = await prisma.inviteCode.findUnique({
    where: { code: codeClean },
  });

  const ruleResult = validateInviteCodeRules(invite as any);
  if (!ruleResult.isValid || !invite) {
    const emailFail = recordInviteFailure(normalizedEmail);
    const ipFail = recordInviteFailure(clientIp);
    const nowLocked = emailFail.isLocked || ipFail.isLocked;
    const lockSec = Math.max(emailFail.remainingSeconds, ipFail.remainingSeconds);

    recordActivityLog({
      email: normalizedEmail,
      name: sessionName,
      image: sessionImage,
      action: nowLocked ? "invite_rate_limit_lockout" : "invite_code_failed",
      status: "failed",
      details: nowLocked
        ? `輸入錯誤邀請碼「${codeClean}」達上限，帳號已被鎖定冷卻 ${lockSec} 秒`
        : `輸入錯誤邀請碼「${codeClean}」: ${ruleResult.errorMessage}`,
      req: reqHeaders,
      ip: clientIp,
    });

    if (nowLocked) {
      return {
        success: false,
        statusCode: 429,
        error: "輸入錯誤次數過多，操作已被暫時限制，請稍後再試。",
      };
    }

    return {
      success: false,
      statusCode: 400,
      error: ruleResult.errorMessage || "邀請碼無效",
    };
  }

  // 3. 驗證通過：重置錯誤鎖定計數
  resetInviteRateLimit(normalizedEmail);
  resetInviteRateLimit(clientIp);

  // 4. 取得或建立使用者
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: sessionName,
        image: sessionImage,
        status: "unregistered",
        groupIds: [],
      },
    });
  }

  const targetGroupIds: string[] = Array.isArray(invite.targetGroupIds)
    ? invite.targetGroupIds
    : [];
  const currentGroupIds: string[] = Array.isArray(user.groupIds) ? user.groupIds : [];
  const mergedGroupIds = Array.from(new Set([...currentGroupIds, ...targetGroupIds]));

  const shouldAutoApprove = Boolean(invite.autoApprove);
  const nextStatus = shouldAutoApprove
    ? "approved"
    : user.status === "approved"
    ? "approved"
    : "pending";

  // 5. 更新使用者狀態與分組權限
  const updatedUser = await prisma.user.update({
    where: { email: normalizedEmail },
    data: {
      groupIds: { set: mergedGroupIds },
      status: nextStatus,
    },
  });

  // 6. 遞增邀請碼已使用次數
  await prisma.inviteCode.update({
    where: { code: codeClean },
    data: {
      usedCount: (invite.usedCount || 0) + 1,
    },
  });

  // 7. 記錄成功審計日誌
  recordActivityLog({
    email: normalizedEmail,
    name: sessionName,
    image: sessionImage,
    action: shouldAutoApprove ? "invite_auto_approve_redeem" : "invite_code_redeem",
    status: "success",
    details: shouldAutoApprove
      ? `使用免審核邀請碼「${codeClean}」成功解鎖並開通 ${targetGroupIds.length} 個分組權限`
      : `使用邀請碼「${codeClean}」兌換成功，指派 ${targetGroupIds.length} 個分組 (狀態: ${nextStatus})`,
    req: reqHeaders,
    ip: clientIp,
  });

  // 8. 若免審核自動開通，非同步寄送歡迎信
  if (shouldAutoApprove) {
    // 查詢目標分組名稱
    prisma.group
      .findMany({
        where: { id: { in: targetGroupIds } },
        select: { name: true },
      })
      .then((groups: any[]) => {
        const groupNames = groups.map((g) => g.name);
        return sendWelcomeAutoApproveEmail(
          normalizedEmail,
          updatedUser.name || sessionName,
          groupNames
        );
      })
      .catch((err: any) => {
        console.error("[Redeem UseCase] Failed to send welcome email:", err);
      });
  }

  return {
    success: true,
    statusCode: 200,
    message: shouldAutoApprove
      ? "邀請碼驗證成功！已自動為您開通專屬分組觀影權限。"
      : "邀請碼兌換成功！已為您更新分組設定。",
    autoApproved: shouldAutoApprove,
    assignedGroupsCount: targetGroupIds.length,
    userStatus: nextStatus,
  };
}
