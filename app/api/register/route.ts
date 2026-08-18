import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";

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
    const body = await req.json();
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

    if (!invite) {
      return NextResponse.json(
        { error: "無效的邀請碼，請確認是否輸入正確" },
        { status: 400 }
      );
    }

    if (invite.disabled) {
      return NextResponse.json(
        { error: "此邀請碼已被管理員停用" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (new Date(invite.expiresAt) < now) {
      return NextResponse.json(
        { error: "此邀請碼已超過有效期限" },
        { status: 400 }
      );
    }

    if (invite.usedCount >= invite.maxUses) {
      return NextResponse.json(
        { error: "此邀請碼已達使用次數上限" },
        { status: 400 }
      );
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
