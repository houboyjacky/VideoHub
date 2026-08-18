import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "請先登入帳號" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.status !== "approved") {
      return NextResponse.json(
        { error: "您的帳號尚未核准，無法進行分組兌換" },
        { status: 403 }
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
    if (incomingGroupIds.length === 0) {
      return NextResponse.json(
        { error: "此邀請碼未綁定任何特定影音分組，無法解鎖新內容" },
        { status: 400 }
      );
    }

    // 2. 計算增量追加分組 (Union)
    const existingGroupIds = user.groupIds || [];
    const newlyAddedGroupIds = incomingGroupIds.filter((id) => !existingGroupIds.includes(id));
    const mergedGroupIds = Array.from(new Set([...existingGroupIds, ...incomingGroupIds]));

    // 3. 更新使用者分組
    await prisma.user.update({
      where: { id: user.id },
      data: { groupIds: mergedGroupIds },
    });

    // 4. 遞增邀請碼使用次數
    await prisma.inviteCode.update({
      where: { id: invite.id },
      data: {
        usedCount: { increment: 1 },
        usedBy: { push: email },
      },
    });

    // 5. 查詢解鎖的分組名稱
    const unlockedGroups = await prisma.group.findMany({
      where: { id: { in: incomingGroupIds } },
    });

    // 6. 記錄活動日誌
    recordActivityLog({
      email,
      name: user.name,
      image: user.image,
      userId: user.id,
      action: "redeem_invite_code",
      status: "success",
      details: `使用邀請碼「${codeClean}」成功解鎖 ${unlockedGroups.map((g) => g.name).join("、")}`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `成功解鎖 ${unlockedGroups.map((g) => g.name).join("、")}`,
      addedCount: newlyAddedGroupIds.length,
      unlockedGroups: unlockedGroups.map((g) => ({ id: g.id, name: g.name })),
    });
  } catch (error) {
    console.error("[Redeem Invite Code Error]:", error);
    return NextResponse.json({ error: "伺服器內部錯誤，請稍候重試" }, { status: 500 });
  }
}
