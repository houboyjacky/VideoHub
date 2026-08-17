import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const { id: groupId } = await params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: "找不到該分組" }, { status: 404 });
    }

    // 1. 從所有使用此 groupId 的影片中解除關聯 ($pull 原子操作)
    await prisma.video.updateMany({
      where: { groupIds: { has: groupId } },
      $pull: { groupIds: groupId },
    });

    // 2. 從所有使用此 groupId 的使用者中解除關聯 ($pull 原子操作)
    await prisma.user.updateMany({
      where: { groupIds: { has: groupId } },
      $pull: { groupIds: groupId },
    });

    // 3. 刪除分組記錄
    await prisma.group.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin Group DELETE Error]:", error);
    return NextResponse.json(
      { error: error?.message || "刪除分組失敗" },
      { status: 500 }
    );
  }
}
