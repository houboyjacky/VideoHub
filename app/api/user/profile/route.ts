import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";

// PATCH: 使用者修改自己的個人稱呼/姓名
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "請先登入帳號" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const body = await req.json().catch(() => ({}));
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "請輸入有效的稱呼或姓名" }, { status: 400 });
    }

    const cleanName = name.trim();
    if (cleanName.length > 50) {
      return NextResponse.json({ error: "稱呼長度不可超過 50 個字元" }, { status: 400 });
    }

    const current = await prisma.user.findUnique({ where: { email } });
    if (!current) {
      return NextResponse.json({ error: "找不到該使用者帳號" }, { status: 404 });
    }

    if (current.disabled) {
      return NextResponse.json({ error: "您的帳號已被停用，無法修改資料" }, { status: 403 });
    }

    const updated = await prisma.user.update({
      where: { email },
      data: { name: cleanName },
    });

    recordActivityLog({
      email,
      name: cleanName,
      image: updated.image,
      userId: updated.id,
      action: "user_update_profile",
      status: "success",
      details: `使用者將稱呼從「${current.name}」修改為「${cleanName}」`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "個人稱呼已成功更新",
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
      },
    });
  } catch (error) {
    console.error("[User Profile PATCH Error]:", error);
    return NextResponse.json({ error: "更新個人稱呼失敗" }, { status: 500 });
  }
}
