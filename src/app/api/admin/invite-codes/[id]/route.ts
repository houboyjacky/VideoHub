import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";

// DELETE: 刪除邀請碼（強制要求必須先處於停用狀態）
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const { id } = await context.params;

    const current = await prisma.inviteCode.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "找不到該邀請碼" }, { status: 404 });
    }

    // 🔒 業務安全規則：邀請碼必須先停用 (disabled === true) 才能被刪除
    if (!current.disabled) {
      return NextResponse.json(
        { error: "邀請碼必須先停用後方可刪除。請先點擊停用按鈕，再進行刪除。" },
        { status: 400 }
      );
    }

    await prisma.inviteCode.delete({
      where: { id },
    });

    // 記錄活動審計日誌
    const adminEmail = check.session.user?.email || "";
    recordActivityLog({
      email: adminEmail,
      name: "管理員",
      action: "admin_delete_invite_code",
      status: "success",
      details: `管理員刪除已停用之邀請碼：${current.code} (上限: ${current.maxUses}, 已用: ${current.usedCount})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `已成功刪除邀請碼【${current.code}】`,
    });
  } catch (error) {
    console.error("[Admin Invite Code DELETE Error]:", error);
    return NextResponse.json({ error: "刪除邀請碼失敗" }, { status: 500 });
  }
}
