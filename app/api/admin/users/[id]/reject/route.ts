import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendRejectionEmail } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "找不到該用戶" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: "rejected",
      },
    });

    // 非同步發送通知信
    sendRejectionEmail(updatedUser.email, updatedUser.name).catch((err) => {
      console.error(`[Reject Email Send Error] for ${updatedUser.email}:`, err);
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("[Admin User Reject Error]:", error);
    return NextResponse.json({ error: "拒絕申請失敗" }, { status: 500 });
  }
}
