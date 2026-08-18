import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";

// PATCH: 更新用戶資訊（改名、停用/啟用、分組更新）
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const { id } = await context.params;
    const body = await req.json();
    const { name, disabled, groupIds } = body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "找不到該用戶" }, { status: 404 });
    }

    const updateData: any = {};

    if (typeof name === "string" && name.trim().length > 0) {
      updateData.name = name.trim();
    }

    if (typeof disabled === "boolean") {
      updateData.disabled = disabled;
    }

    if (Array.isArray(groupIds)) {
      updateData.groupIds = groupIds;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const adminEmail = check.session.user.email || "";

    recordActivityLog({
      email: adminEmail,
      name: "管理員",
      userId: id,
      action: "admin_update_user",
      status: "success",
      details: `更新用戶「${updated.name}」(${updated.email})：${JSON.stringify(updateData)}`,
      req,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("[Admin User PATCH Error]:", error);
    return NextResponse.json({ error: "更新用戶失敗" }, { status: 500 });
  }
}

// DELETE: 刪除用戶帳號
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const { id } = await context.params;
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "找不到該用戶" }, { status: 404 });
    }

    const adminEmail = check.session.user.email || "";

    // 防止管理員誤刪自己
    if (existing.email.toLowerCase() === adminEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "無法刪除目前正在操作的管理員帳號" },
        { status: 409 }
      );
    }

    await prisma.user.delete({ where: { id } });

    recordActivityLog({
      email: adminEmail,
      name: "管理員",
      action: "admin_delete_user",
      status: "success",
      details: `永久刪除用戶「${existing.name}」(${existing.email})`,
      req,
    });

    return NextResponse.json({ success: true, message: `已刪除用戶「${existing.name}」` });
  } catch (error) {
    console.error("[Admin User DELETE Error]:", error);
    return NextResponse.json({ error: "刪除用戶失敗" }, { status: 500 });
  }
}
