import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendApprovalEmail } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { groupIds } = body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "找不到該用戶" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: "approved",
        approvedAt: new Date(),
        groupIds: Array.isArray(groupIds) ? groupIds : user.groupIds,
      },
    });

    // 非同步發送通知信
    sendApprovalEmail(updatedUser.email, updatedUser.name).catch((err) => {
      console.error(`[Approve Email Send Error] for ${updatedUser.email}:`, err);
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("[Admin User Approve Error]:", error);
    return NextResponse.json({ error: "審核通過失敗" }, { status: 500 });
  }
}
