import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { groupIds } = body;

    if (!Array.isArray(groupIds)) {
      return NextResponse.json({ error: "groupIds 格式錯誤" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        groupIds: { set: groupIds },
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("[Admin User Groups PUT Error]:", error);
    return NextResponse.json({ error: "更新用戶分組失敗" }, { status: 500 });
  }
}
