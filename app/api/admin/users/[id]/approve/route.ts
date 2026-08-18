import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { approveUserUseCase, updateUserGroupsUseCase } from "@/lib/application/use-cases/admin-user-management.usecase";

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

    if (Array.isArray(groupIds)) {
      await updateUserGroupsUseCase({
        userId: id,
        groupIds,
        adminEmail: check.session.user?.email || "admin",
        adminName: check.session.user?.name || "管理員",
        reqHeaders: req.headers,
      });
    }

    const result = await approveUserUseCase({
      userId: id,
      adminEmail: check.session.user?.email || "admin",
      adminName: check.session.user?.name || "管理員",
      reqHeaders: req.headers,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error("[Admin User Approve Error]:", error);
    return NextResponse.json({ error: "審核通過失敗" }, { status: 500 });
  }
}
