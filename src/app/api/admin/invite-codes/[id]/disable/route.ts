import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { disabled } = body;

    const current = await prisma.inviteCode.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "找不到該邀請碼" }, { status: 404 });
    }

    const updated = await prisma.inviteCode.update({
      where: { id },
      data: {
        disabled: typeof disabled === "boolean" ? disabled : !current.disabled,
      },
    });

    return NextResponse.json({ success: true, inviteCode: updated });
  } catch (error) {
    console.error("[Admin Invite Code Toggle Error]:", error);
    return NextResponse.json({ error: "更新邀請碼狀態失敗" }, { status: 500 });
  }
}
